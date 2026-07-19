package com.hubblehox.e2j.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    /** Free-tier models in descending quality order, each tagged with its free-tier TPM (tokens/minute) ceiling. */
    private record ModelOption(String name, int tpmLimit) {}
    private static final List<ModelOption> MODEL_CASCADE = List.of(
        new ModelOption("openai/gpt-oss-120b", 8000),      // strongest, but tightest TPM
        new ModelOption("llama-3.3-70b-versatile", 12000), // best TPM headroom of the strong models
        new ModelOption("openai/gpt-oss-20b", 8000),
        new ModelOption("llama-3.1-8b-instant", 6000)      // last resort — weakest but cheapest per-request
    );

    /** Picks the best-quality model whose TPM ceiling comfortably fits this request's estimated token size (prompt + max_tokens), with a 10% safety margin. Falls back to the model with the most headroom if nothing fits cleanly. */
    private String selectModel(List<Message> messages, int maxTokens) {
        int promptTokens = messages.stream().mapToInt(m -> m.content().length() / 4).sum();
        int estimated = promptTokens + maxTokens;
        for (ModelOption opt : MODEL_CASCADE) {
            if (estimated <= opt.tpmLimit() * 0.9) {
                log.debug("[Groq] Selected model={} | estimatedTokens={}", opt.name(), estimated);
                return opt.name();
            }
        }
        ModelOption fallback = MODEL_CASCADE.stream().max(Comparator.comparingInt(ModelOption::tpmLimit)).orElseThrow();
        log.warn("[Groq] No model comfortably fits estimatedTokens={} — using highest-TPM fallback={}", estimated, fallback.name());
        return fallback.name();
    }

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public record Message(String role, String content) {}

    public String chat(List<Message> messages) {
        return chat(messages, 1024);
    }

    public String chat(List<Message> messages, int maxTokens) {
        return chatCascade(messages, maxTokens, true);
    }

    /** Tries each model in the cascade (best-fit first) until one succeeds. A model that's rate-limited
     *  for a long wait (e.g. daily quota exhausted) is skipped in favor of the next model rather than blocking. */
    private String chatCascade(List<Message> messages, int maxTokens, boolean jsonMode) {
        List<ModelOption> candidates = candidatesFor(messages, maxTokens);
        Exception lastError = null;
        for (ModelOption opt : candidates) {
            try {
                ObjectNode body = mapper.createObjectNode();
                body.put("model", opt.name());
                body.put("temperature", 0.7);
                body.put("max_tokens", maxTokens);

                ArrayNode msgs = body.putArray("messages");
                for (Message m : messages) {
                    ObjectNode node = mapper.createObjectNode();
                    node.put("role", m.role());
                    node.put("content", m.content());
                    msgs.add(node);
                }

                if (jsonMode) {
                    ObjectNode responseFormat = mapper.createObjectNode();
                    responseFormat.put("type", "json_object");
                    body.set("response_format", responseFormat);
                }

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(GROQ_URL))
                        .header("Authorization", "Bearer " + apiKey)
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                        .build();

                JsonNode root = sendWithRetry(req);
                JsonNode choices = root.path("choices");
                if (!choices.isArray() || choices.size() == 0) throw new RuntimeException("Groq returned no choices");
                return choices.get(0).path("message").path("content").asText();
            } catch (Exception e) {
                lastError = e;
                log.warn("[Groq] model={} failed, trying next fallback | error={}", opt.name(), e.getMessage());
            }
        }
        throw new RuntimeException("Groq API call failed on all fallback models: "
                + (lastError != null ? lastError.getMessage() : "unknown error"), lastError);
    }

    /** Cascade of models to try, in order: the best-fit model for this request's size first, then the
     *  rest of the quality-ordered cascade as fallbacks (in case the first choice is rate-limited/exhausted). */
    private List<ModelOption> candidatesFor(List<Message> messages, int maxTokens) {
        String best = selectModel(messages, maxTokens);
        List<ModelOption> ordered = new java.util.ArrayList<>();
        MODEL_CASCADE.stream().filter(o -> o.name().equals(best)).findFirst().ifPresent(ordered::add);
        MODEL_CASCADE.stream().filter(o -> !o.name().equals(best)).forEach(ordered::add);
        return ordered;
    }

    /** Sends the request; on a short rate-limit (429) wait (<=30s), sleeps it out and retries once.
     *  On a long wait (e.g. daily quota exhausted, could be hours) it throws immediately instead of
     *  blocking, so the caller's model cascade can fall back to a different model right away. */
    private JsonNode sendWithRetry(HttpRequest req) throws Exception {
        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        JsonNode root = mapper.readTree(res.body());
        if (root.has("error")) {
            String errMsg = root.path("error").path("message").asText();
            if (res.statusCode() == 429) {
                Long waitMs = parseRetryWaitMs(errMsg);
                if (waitMs != null && waitMs <= 30_000) {
                    try { Thread.sleep(waitMs + 500); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                    res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                    root = mapper.readTree(res.body());
                    if (root.has("error")) throw new RuntimeException("Groq API error: " + root.path("error").path("message").asText());
                    return root;
                }
            }
            throw new RuntimeException("Groq API error: " + errMsg);
        }
        return root;
    }

    /** Parses Groq's "please try again in 19.83s" or "...in 1h15m55.872s" wait hint into milliseconds. */
    private Long parseRetryWaitMs(String errMsg) {
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("try again in (?:([0-9]+)h)?(?:([0-9]+)m)?(?:([0-9.]+)s)?").matcher(errMsg);
        if (!m.find()) return null;
        if (m.group(1) == null && m.group(2) == null && m.group(3) == null) return null;
        long hours = m.group(1) != null ? Long.parseLong(m.group(1)) : 0;
        long mins = m.group(2) != null ? Long.parseLong(m.group(2)) : 0;
        double secs = m.group(3) != null ? Double.parseDouble(m.group(3)) : 0;
        return hours * 3_600_000L + mins * 60_000L + (long) (secs * 1000);
    }

    /** Fetch top N trending job roles for a given program using Groq */
    public List<String> fetchTopJobRoles(String programName, String major, String degree, int count) {
        String prompt = String.format("""
            You are a job market analyst specializing in India's tech and education sector.
            List the top %d most in-demand job roles in 2025 for a student graduating with a %s in %s (%s).
            Focus on roles that are actively hiring in India and globally.
            Return ONLY this JSON — no explanation, no markdown:
            { "roles": ["Role 1", "Role 2", "Role 3"] }
            """, count, degree, major, programName);

        try {
            String raw = chat(List.of(
                new Message("system", "You are a job market analyst. Always respond in valid JSON only."),
                new Message("user", prompt)
            ));
            JsonNode root = mapper.readTree(raw);
            List<String> roles = new java.util.ArrayList<>();
            root.path("roles").forEach(r -> roles.add(r.asText()));
            return roles;
        } catch (Exception e) {
            return List.of();
        }
    }

    /** Strips bulky, non-essential fields (objectives/outcomes/skills/relevantRoles) down to just
     *  code/name/topics/hours for a single semester node — the model only needs this to redesign it,
     *  and dropping the rest keeps each per-semester request comfortably small. */
    private String slimSemester(JsonNode sem) {
        ObjectNode slimSem = mapper.createObjectNode();
        slimSem.put("name", sem.path("name").asText());
        ArrayNode slimSubjects = slimSem.putArray("subjects");
        for (JsonNode sub : sem.path("subjects")) {
            ObjectNode slimSub = mapper.createObjectNode();
            slimSub.put("code", sub.path("code").asText());
            slimSub.put("name", sub.path("name").asText());
            ArrayNode slimModules = slimSub.putArray("modules");
            for (JsonNode mod : sub.path("modules")) {
                ObjectNode slimMod = mapper.createObjectNode();
                slimMod.put("number", mod.path("number").asInt());
                slimMod.put("name", mod.path("name").asText());
                slimMod.put("topics", mod.path("topics").asText());
                slimMod.put("hours", mod.path("hours").asInt());
                slimModules.add(slimMod);
            }
            slimSubjects.add(slimSub);
        }
        return slimSem.toString();
    }

    /** Generate enhanced curriculum from syllabus JSON, targeted at specific job roles.
     *  Generates ONE SEMESTER PER GROQ CALL and merges the results — a full multi-semester program
     *  sent in a single request routinely exceeds every free-tier model's TPM ceiling, whereas a
     *  single semester's worth of subjects/modules comfortably fits under any of them. */
    public String generateEnhancedCurriculum(String syllabusJson, List<String> targetJobRoles) {
        JsonNode semesters;
        try {
            semesters = mapper.readTree(syllabusJson);
        } catch (Exception e) {
            throw new RuntimeException("Invalid syllabus JSON: " + e.getMessage(), e);
        }

        String rolesSection = targetJobRoles.isEmpty() ? ""
            : "\n\nTop 5 trending job roles this curriculum must be redesigned around:\n"
              + String.join(", ", targetJobRoles)
              + "\n\nDo not simply return the input curriculum unchanged — genuinely add, remove, and retain modules based on how well they serve these 5 roles specifically.";

        String systemPrompt = """
            You are an expert curriculum designer for higher education institutions in India.
            You will receive ONE SEMESTER of a program syllabus in JSON (not the whole program) and a
            list of target job roles. Your goal is to enhance that semester so graduates are job-ready
            for those roles. Return ONLY valid JSON — no markdown fences, no explanation outside JSON.

            Required output format:
            {
              "targetRoles": ["Role 1", "Role 2"],
              "semesters": [
                {
                  "name": "Semester 1",
                  "subjects": [
                    {
                      "code": "CS101",
                      "name": "Subject Name",
                      "objectives": ["objective 1", "objective 2"],
                      "outcomes": ["outcome 1", "outcome 2"],
                      "skills": ["Skill A", "Skill B", "Skill C"],
                      "relevantRoles": ["Role 1", "Role 3"],
                      "modules": [
                        {
                          "number": 1,
                          "name": "Module Name",
                          "topics": "topics covered",
                          "hours": 8,
                          "changed": false,
                          "removed": false,
                          "priority": "must_have",
                          "skills": ["Skill A", "Skill B"],
                          "relevantRoles": ["Role 1"]
                        }
                      ]
                    }
                  ]
                }
              ],
              "changes": [
                {
                  "semester": "Semester 1",
                  "subjectCode": "CS101",
                  "subjectName": "Subject Name",
                  "type": "module_added",
                  "original": null,
                  "suggested": "New module content",
                  "reason": "Why this change improves job readiness for the target roles"
                }
              ]
            }

            CRITICAL — do not just echo the input curriculum back with cosmetic labels.
            You must genuinely re-evaluate every module against the top 5 trending target roles
            supplied to you, and actually change the curriculum where it falls short:
            - Identify skill gaps the current curriculum does NOT cover for the top 5 trending roles,
              and ADD new modules/subjects that close those gaps.
            - Identify modules that are outdated, obsolete, or irrelevant to all 5 trending roles,
              and mark them for REMOVAL rather than leaving them untouched.
            - Only content that is still genuinely relevant and needs no change should be left as CONTINUE.
            A response that marks every module "should_have"/unchanged with no additions or removals
            is invalid — assume the existing curriculum is always improvable.

            Rules:
            - Change types: module_added, module_modified, module_removed, objective_updated, outcome_updated.
            - Mark changed/added modules with "changed": true in the semesters array.
            - Mark outdated/obsolete modules that should be dropped with "removed": true AND "changed": true — these render RED (strikethrough) in the UI.
            - For every module NOT removed, set "priority" to exactly one of:
              - "must_have" — a NEW or heavily reworked module added specifically to close a gap for one of the top 5 trending roles. Renders GREEN.
              - "should_have" — an EXISTING module that is still valid and should simply continue as-is. Renders YELLOW.
              - "good_to_have" — an existing module that's tangentially useful but not tied to any of the top 5 trending roles. Renders AMBER.
            - Only mark a module "must_have" if it is new/substantially changed AND directly builds a skill demanded by at least one of the top 5 trending target roles.
            - Every semester should contain a realistic mix of all three states (some removed, some must_have/new, most should_have) — do not return a curriculum where nothing was added or removed.
            - Populate "targetRoles" at the root with the exact list of the top 5 trending job roles provided.
            - For each subject: "skills" = 3-6 practical skills students will gain; "relevantRoles" = subset of target roles this subject directly prepares for.
            - For each module: "skills" = 2-4 specific skills from that module; "relevantRoles" = which target roles benefit from this module.
            - Prioritize: industry-relevant tools, modern technologies, practical skills demanded specifically by the top 5 trending roles — not generic curriculum best practices.
            - The "changes" array must list every addition and removal with a clear "reason" tying it back to one of the top 5 trending roles.
            - The "semesters" array in your response must contain EXACTLY ONE semester — the one you were given.
            """;

        ArrayNode mergedSemesters = mapper.createArrayNode();
        ArrayNode mergedChanges = mapper.createArrayNode();

        for (JsonNode sem : semesters) {
            String semName = sem.path("name").asText("semester");
            List<Message> messages = List.of(
                new Message("system", systemPrompt),
                new Message("user", "Current semester syllabus:\n" + slimSemester(sem) + rolesSection
                    + "\n\nProvide enhanced curriculum recommendations for this semester.")
            );
            String raw;
            try {
                raw = chatCascade(messages, 3000, true);
            } catch (RuntimeException e) {
                throw new RuntimeException("Curriculum generation failed on " + semName + ": " + e.getMessage(), e);
            }
            JsonNode parsed;
            try {
                parsed = mapper.readTree(raw);
            } catch (Exception e) {
                throw new RuntimeException("Groq returned invalid JSON for " + semName + ": " + e.getMessage(), e);
            }
            parsed.path("semesters").forEach(mergedSemesters::add);
            parsed.path("changes").forEach(mergedChanges::add);
            log.info("[Groq] Generated curriculum for {} | changes={}", semName, parsed.path("changes").size());
        }

        ObjectNode result = mapper.createObjectNode();
        ArrayNode targetRolesNode = result.putArray("targetRoles");
        targetJobRoles.forEach(targetRolesNode::add);
        result.set("semesters", mergedSemesters);
        result.set("changes", mergedChanges);

        try {
            return mapper.writeValueAsString(result);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize merged curriculum: " + e.getMessage(), e);
        }
    }

    /** Plain text chat without JSON mode */
    public String chatText(List<Message> messages) {
        return chatCascade(messages, 2048, false);
    }
}
