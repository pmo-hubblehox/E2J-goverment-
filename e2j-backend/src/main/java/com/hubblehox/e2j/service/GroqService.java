package com.hubblehox.e2j.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.1-8b-instant";

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public record Message(String role, String content) {}

    public String chat(List<Message> messages) {
        return chat(messages, 1024);
    }

    public String chat(List<Message> messages, int maxTokens) {
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", MODEL);
            body.put("temperature", 0.7);
            body.put("max_tokens", maxTokens);

            ArrayNode msgs = body.putArray("messages");
            for (Message m : messages) {
                ObjectNode node = mapper.createObjectNode();
                node.put("role", m.role());
                node.put("content", m.content());
                msgs.add(node);
            }

            // Ask for JSON response
            ObjectNode responseFormat = mapper.createObjectNode();
            responseFormat.put("type", "json_object");
            body.set("response_format", responseFormat);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(GROQ_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(res.body());
            if (root.has("error")) throw new RuntimeException("Groq API error: " + root.path("error").path("message").asText());
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.size() == 0) throw new RuntimeException("Groq returned no choices");
            return choices.get(0).path("message").path("content").asText();
        } catch (RuntimeException e) { throw e;
        } catch (Exception e) {
            throw new RuntimeException("Groq API call failed: " + e.getMessage(), e);
        }
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

    /** Generate enhanced curriculum from syllabus JSON, targeted at specific job roles */
    public String generateEnhancedCurriculum(String syllabusJson, List<String> targetJobRoles) {
        String rolesSection = targetJobRoles.isEmpty() ? ""
            : "\n\nTarget job roles this curriculum should prepare students for:\n"
              + String.join(", ", targetJobRoles)
              + "\n\nEnsure the curriculum builds skills and knowledge that directly improve employability for these roles.";

        String systemPrompt = """
            You are an expert curriculum designer for higher education institutions in India.
            You will receive a program syllabus in JSON and a list of target job roles.
            Your goal is to enhance the curriculum so graduates are job-ready for those roles.
            Return ONLY valid JSON — no markdown fences, no explanation outside JSON.

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

            Rules:
            - Change types: module_added, module_modified, module_removed, objective_updated, outcome_updated.
            - Mark changed/added modules with "changed": true in the semesters array.
            - Mark outdated/obsolete modules that should be dropped with "removed": true AND "changed": true.
            - For every module set "priority": one of "must_have" (critical for top trending roles — show GREEN), "good_to_have" (useful but not critical — show AMBER). Removed modules automatically show RED.
            - Only mark a module "must_have" if it directly builds a skill demanded by at least one of the top trending target roles.
            - Populate "targetRoles" at the root with the exact list of job roles provided.
            - For each subject: "skills" = 3-6 practical skills students will gain; "relevantRoles" = subset of target roles this subject directly prepares for.
            - For each module: "skills" = 2-4 specific skills from that module; "relevantRoles" = which target roles benefit from this module.
            - Prioritize: industry-relevant tools, modern technologies, practical skills demanded by the target roles.
            - Keep existing solid content — only improve what needs updating.
            """;

        List<Message> messages = List.of(
            new Message("system", systemPrompt),
            new Message("user", "Current curriculum:\n" + syllabusJson + rolesSection + "\n\nProvide enhanced curriculum recommendations.")
        );

        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", MODEL);
            body.put("temperature", 0.7);
            body.put("max_tokens", 8192);

            ArrayNode msgs = body.putArray("messages");
            for (Message m : messages) {
                ObjectNode node = mapper.createObjectNode();
                node.put("role", m.role());
                node.put("content", m.content());
                msgs.add(node);
            }

            ObjectNode responseFormat = mapper.createObjectNode();
            responseFormat.put("type", "json_object");
            body.set("response_format", responseFormat);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(GROQ_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(res.body());

            // Check for Groq API-level error
            if (root.has("error")) {
                String errMsg = root.path("error").path("message").asText(root.path("error").asText());
                throw new RuntimeException("Groq API error: " + errMsg);
            }

            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.size() == 0) {
                throw new RuntimeException("Groq returned empty choices. Response: " + res.body().substring(0, Math.min(300, res.body().length())));
            }

            return choices.get(0).path("message").path("content").asText();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Groq curriculum generation failed: " + e.getMessage(), e);
        }
    }

    /** Plain text chat without JSON mode */
    public String chatText(List<Message> messages) {
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", MODEL);
            body.put("temperature", 0.7);
            body.put("max_tokens", 2048);

            ArrayNode msgs = body.putArray("messages");
            for (Message m : messages) {
                ObjectNode node = mapper.createObjectNode();
                node.put("role", m.role());
                node.put("content", m.content());
                msgs.add(node);
            }

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(GROQ_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(res.body());
            if (root.has("error")) throw new RuntimeException("Groq API error: " + root.path("error").path("message").asText());
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.size() == 0) throw new RuntimeException("Groq returned no choices");
            return choices.get(0).path("message").path("content").asText();
        } catch (RuntimeException e) { throw e;
        } catch (Exception e) {
            throw new RuntimeException("Groq API call failed: " + e.getMessage(), e);
        }
    }
}
