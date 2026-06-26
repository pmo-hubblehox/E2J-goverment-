package com.hubblehox.e2j.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hubblehox.e2j.dto.SkillGapDto;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
// import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
// import org.springframework.util.LinkedMultiValueMap;
// import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SkillGapService {

    private final StudentRepository studentRepo;
    private final StudentResumeRepository resumeRepo;
    private final StudentEducationRepository educationRepo;
    private final SkillGapReportRepository reportRepo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GroqService groqService;

    // In-memory store for Groq-generated results keyed by task UUID
    private final ConcurrentHashMap<String, String> taskResults = new ConcurrentHashMap<>();

    // @Value("${skill-gap.api-url:http://localhost:8000}")
    // private String skillGapApiUrl;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public SkillGapDto.AnalyzeResponse startAnalysis(User user, String targetRole) {
        log.info("[SkillGap] startAnalysis called | user={} | targetRole={}", user.getEmail(), targetRole);
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
        log.debug("[SkillGap] Student found | studentId={}", student.getId());

        List<StudentResume> resumes = resumeRepo.findByStudentOrderByUploadedAtDesc(student);

        // prefer primary with a URL → any with a URL → give up
        String resolvedResumeUrl = resumes.stream()
                .filter(r -> r.isPrimary() && r.getFileUrl() != null && !r.getFileUrl().isBlank())
                .map(StudentResume::getFileUrl)
                .findFirst()
                .orElseGet(() -> resumes.stream()
                        .filter(r -> r.getFileUrl() != null && !r.getFileUrl().isBlank())
                        .map(StudentResume::getFileUrl)
                        .findFirst()
                        .orElse(null));

        if (resolvedResumeUrl == null) {
            log.warn("[SkillGap] No resume found | studentId={}", student.getId());
            throw new AppException("No resume found. Please upload your resume in your profile first.", HttpStatus.BAD_REQUEST);
        }
        log.info("[SkillGap] Resolved resume URL | url={}", resolvedResumeUrl);

        List<StudentEducation> educations = educationRepo.findByStudentOrderByCreatedAtAsc(student);
        String curriculum = educations.isEmpty() ? "Computer Science"
                : (educations.get(educations.size() - 1).getMajorSpecialization() != null
                ? educations.get(educations.size() - 1).getMajorSpecialization()
                : "Computer Science");

        log.info("[SkillGap] Curriculum resolved | curriculum={}", curriculum);

        byte[] resumeBytes;
        try {
            if (resolvedResumeUrl.startsWith("http")) {
                log.info("[SkillGap] Fetching resume from remote URL");
                ResponseEntity<byte[]> fileResp = restTemplate.getForEntity(resolvedResumeUrl, byte[].class);
                resumeBytes = fileResp.getBody();
            } else {
                String relativePath = resolvedResumeUrl
                        .replaceFirst("^/api/files/", "")
                        .replaceFirst("^/files/", "");
                resumeBytes = Files.readAllBytes(Paths.get(uploadDir, relativePath.split("/")));
            }
            if (resumeBytes == null || resumeBytes.length == 0) {
                log.warn("[SkillGap] Resume file is empty | studentId={}", student.getId());
                throw new AppException("Could not read resume file.", HttpStatus.BAD_REQUEST);
            }
            log.info("[SkillGap] Resume fetched successfully | sizeBytes={}", resumeBytes.length);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("[SkillGap] Failed to fetch resume | error={}", e.getMessage());
            throw new AppException("Failed to fetch resume: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        // --- Groq-based skill gap analysis (replaces Python service call) ---
        try {
            String resumeText;
            try (PDDocument doc = Loader.loadPDF(new ByteArrayInputStream(resumeBytes))) {
                resumeText = new PDFTextStripper().getText(doc);
            }
            if (resumeText == null || resumeText.isBlank()) {
                log.warn("[SkillGap] PDF text extraction returned blank | studentId={}", student.getId());
                throw new AppException("Could not extract text from resume PDF.", HttpStatus.BAD_REQUEST);
            }
            log.info("[SkillGap] PDF text extracted | chars={} | truncating={}", resumeText.length(), resumeText.length() > 4000);
            String truncatedResume = resumeText.length() > 4000 ? resumeText.substring(0, 4000) : resumeText;

            String prompt = String.format("""
                You are an expert career analyst with deep knowledge of the current job market and university curricula in India.

                Student's academic background (curriculum/major): %s
                Target job role: %s

                Resume text:
                %s

                Using your knowledge of:
                - What skills are currently demanded in the job market for "%s"
                - What topics are typically taught in a "%s" curriculum at Indian universities
                - What skills the student already has based on their resume

                Return ONLY this JSON (no markdown, no explanation, no extra keys):
                {
                  "skill_clusters_w_classification": {
                    "Technical": {
                      "<ClusterName>": [["<skillName>", <importanceWeight 1-10>, <studentHasSkill true/false>], ...]
                    },
                    "Knowledge": {
                      "<ClusterName>": [["<skillName>", <importanceWeight 1-10>, <studentHasSkill true/false>], ...]
                    },
                    "Soft": {
                      "<ClusterName>": [["<skillName>", <importanceWeight 1-10>, <studentHasSkill true/false>], ...]
                    }
                  },
                  "cluster_wise_course_recommendation": {
                    "Technical": {
                      "<ClusterName>": {
                        "title": "<ClusterName>",
                        "courses": {
                          "Free": [["<course title>", "<url>"]],
                          "Paid": [["<course title>", "<url>"]]
                        }
                      }
                    },
                    "Knowledge": {},
                    "Soft": {}
                  }
                }

                Rules:
                - Include 4-6 clusters per skill type (Technical, Knowledge, Soft)
                - Each cluster should have 4-8 skills
                - importanceWeight: how critical this skill is for the target role (1=low, 10=critical)
                - studentHasSkill: true if the resume clearly shows this skill, false if it is a gap
                - Only include course recommendations for Technical clusters where gaps exist
                - Use real, well-known course URLs (Coursera, YouTube, edX, Udemy) — if unsure use a search URL like https://www.coursera.org/search?query=<skill>
                """, curriculum, targetRole, truncatedResume, targetRole, curriculum);

            log.info("[SkillGap] Sending prompt to Groq | targetRole={} | curriculum={}", targetRole, curriculum);
            String resultJson = groqService.chat(List.of(
                new GroqService.Message("system", "You are a career analyst. Always respond in valid JSON only. Never use markdown fences."),
                new GroqService.Message("user", prompt)
            ), 4096);
            log.info("[SkillGap] Groq response received | responseChars={}", resultJson != null ? resultJson.length() : 0);

            String taskId = UUID.randomUUID().toString();
            taskResults.put(taskId, resultJson);
            log.info("[SkillGap] Analysis complete | taskId={} | user={}", taskId, user.getEmail());

            return SkillGapDto.AnalyzeResponse.builder()
                    .taskId(taskId)
                    .message("Analysis started")
                    .build();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("[SkillGap] Groq analysis failed | error={}", e.getMessage(), e);
            throw new AppException("Failed to run skill gap analysis: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        /* --- Python service call (commented out) ---
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource resumeResource = new ByteArrayResource(resumeBytes) {
            @Override public String getFilename() { return "resume.pdf"; }
        };
        body.add("resume_file", resumeResource);
        body.add("job_designation", targetRole);
        body.add("curriculum_choice", curriculum);
        body.add("num_sample_jobs", "5");
        body.add("analysis_mode", "quick");

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    skillGapApiUrl + "/api/analyze", request, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());
            String taskId = json.path("task_id").asText();
            return SkillGapDto.AnalyzeResponse.builder()
                    .taskId(taskId)
                    .message("Analysis started")
                    .build();
        } catch (Exception e) {
            throw new AppException("Failed to start analysis: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
        --- end Python service call --- */
    }

    public SkillGapDto.StatusResponse getStatus(String taskId) {
        log.info("[SkillGap] getStatus called | taskId={}", taskId);
        // Groq analysis is synchronous — task is always complete by the time the ID is returned
        if (taskResults.containsKey(taskId)) {
            log.debug("[SkillGap] Task found and complete | taskId={}", taskId);
            return SkillGapDto.StatusResponse.builder()
                    .status("completed")
                    .progress(100)
                    .message("Analysis complete")
                    .build();
        }
        log.warn("[SkillGap] Task not found | taskId={}", taskId);
        throw new AppException("Task not found", HttpStatus.NOT_FOUND);

        /* --- Python service call (commented out) ---
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                    skillGapApiUrl + "/api/status/" + taskId, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());
            return SkillGapDto.StatusResponse.builder()
                    .status(json.path("status").asText())
                    .progress(json.path("progress").asInt(0))
                    .message(json.path("message").asText())
                    .build();
        } catch (Exception e) {
            throw new AppException("Failed to get status: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
        --- end Python service call --- */
    }

    public String getResult(String taskId) {
        log.info("[SkillGap] getResult called | taskId={}", taskId);
        String result = taskResults.get(taskId);
        if (result == null) {
            log.warn("[SkillGap] Result not found | taskId={}", taskId);
            throw new AppException("Result not found for task: " + taskId, HttpStatus.NOT_FOUND);
        }
        log.info("[SkillGap] Returning result | taskId={} | resultChars={}", taskId, result.length());
        return result;

        /* --- Python service call (commented out) ---
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                    skillGapApiUrl + "/api/result/" + taskId, String.class);
            return response.getBody();
        } catch (Exception e) {
            throw new AppException("Failed to get result: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
        --- end Python service call --- */
    }

    public void cancelAnalysis(String taskId) {
        log.info("[SkillGap] cancelAnalysis called | taskId={}", taskId);
        taskResults.remove(taskId);

        /* --- Python service call (commented out) ---
        try {
            restTemplate.delete(skillGapApiUrl + "/api/cancel/" + taskId);
        } catch (Exception e) {
            // Best-effort — if the task already finished or the endpoint doesn't exist, ignore
        }
        --- end Python service call --- */
    }

    @Transactional
    public SkillGapDto.ReportSummary saveReport(User user, SkillGapDto.SaveRequest req) {
        log.info("[SkillGap] saveReport called | user={} | targetRole={}", user.getEmail(), req.getTargetRole());
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));

        // Upsert: update existing report for same role (case-insensitive) instead of inserting duplicates
        SkillGapReport report = reportRepo
                .findFirstByStudentAndTargetRoleIgnoreCaseOrderByGeneratedAtDesc(student, req.getTargetRole())
                .orElse(SkillGapReport.builder().student(student).targetRole(req.getTargetRole()).build());
        report.setCurriculum(req.getCurriculum());
        report.setReportJson(req.getResultJson());
        report = reportRepo.save(report);
        log.info("[SkillGap] Report saved | reportId={} | studentId={} | targetRole={}", report.getId(), student.getId(), report.getTargetRole());

        return SkillGapDto.ReportSummary.builder()
                .id(report.getId())
                .targetRole(report.getTargetRole())
                .curriculum(report.getCurriculum())
                .generatedAt(report.getGeneratedAt())
                .build();
    }

    public List<SkillGapDto.ReportSummary> getSavedReports(User user) {
        log.info("[SkillGap] getSavedReports called | user={}", user.getEmail());
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));

        return reportRepo.findByStudentOrderByGeneratedAtDesc(student).stream()
                .map(r -> SkillGapDto.ReportSummary.builder()
                        .id(r.getId())
                        .targetRole(r.getTargetRole())
                        .curriculum(r.getCurriculum())
                        .generatedAt(r.getGeneratedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public SkillGapDto.ReportDetail getReportById(User user, Long reportId) {
        log.info("[SkillGap] getReportById called | user={} | reportId={}", user.getEmail(), reportId);
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));

        SkillGapReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new AppException("Report not found", HttpStatus.NOT_FOUND));

        if (!report.getStudent().getId().equals(student.getId())) {
            log.warn("[SkillGap] Access denied | user={} | reportId={}", user.getEmail(), reportId);
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }
        log.info("[SkillGap] Returning report | reportId={} | targetRole={}", report.getId(), report.getTargetRole());

        return SkillGapDto.ReportDetail.builder()
                .id(report.getId())
                .targetRole(report.getTargetRole())
                .curriculum(report.getCurriculum())
                .reportJson(report.getReportJson())
                .generatedAt(report.getGeneratedAt())
                .build();
    }
}
