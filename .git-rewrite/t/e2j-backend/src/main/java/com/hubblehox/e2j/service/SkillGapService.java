package com.hubblehox.e2j.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hubblehox.e2j.dto.SkillGapDto;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillGapService {

    private final StudentRepository studentRepo;
    private final StudentResumeRepository resumeRepo;
    private final StudentEducationRepository educationRepo;
    private final SkillGapReportRepository reportRepo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${skill-gap.api-url:http://localhost:8000}")
    private String skillGapApiUrl;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public SkillGapDto.AnalyzeResponse startAnalysis(User user, String targetRole) {
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));

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
            throw new AppException("No resume found. Please upload your resume in your profile first.", HttpStatus.BAD_REQUEST);
        }

        List<StudentEducation> educations = educationRepo.findByStudentOrderByCreatedAtAsc(student);
        String curriculum = educations.isEmpty() ? "Computer Science"
                : (educations.get(educations.size() - 1).getMajorSpecialization() != null
                ? educations.get(educations.size() - 1).getMajorSpecialization()
                : "Computer Science");

        byte[] resumeBytes;
        try {
            if (resolvedResumeUrl.startsWith("http")) {
                ResponseEntity<byte[]> fileResp = restTemplate.getForEntity(resolvedResumeUrl, byte[].class);
                resumeBytes = fileResp.getBody();
            } else {
                // local file — resolve relative URL to disk path
                // /api/files/student/x/resume/f.pdf → uploads/student/x/resume/f.pdf
                String relativePath = resolvedResumeUrl
                        .replaceFirst("^/api/files/", "")
                        .replaceFirst("^/files/", "");
                resumeBytes = Files.readAllBytes(Paths.get(uploadDir, relativePath.split("/")));
            }
            if (resumeBytes == null || resumeBytes.length == 0) {
                throw new AppException("Could not read resume file.", HttpStatus.BAD_REQUEST);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException("Failed to fetch resume: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }

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
    }

    public SkillGapDto.StatusResponse getStatus(String taskId) {
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
    }

    public String getResult(String taskId) {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                    skillGapApiUrl + "/api/result/" + taskId, String.class);
            return response.getBody();
        } catch (Exception e) {
            throw new AppException("Failed to get result: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public void cancelAnalysis(String taskId) {
        try {
            restTemplate.delete(skillGapApiUrl + "/api/cancel/" + taskId);
        } catch (Exception e) {
            // Best-effort — if the task already finished or the endpoint doesn't exist, ignore
        }
    }

    @Transactional
    public SkillGapDto.ReportSummary saveReport(User user, SkillGapDto.SaveRequest req) {
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));

        // Upsert: update existing report for same role (case-insensitive) instead of inserting duplicates
        SkillGapReport report = reportRepo
                .findFirstByStudentAndTargetRoleIgnoreCaseOrderByGeneratedAtDesc(student, req.getTargetRole())
                .orElse(SkillGapReport.builder().student(student).targetRole(req.getTargetRole()).build());
        report.setCurriculum(req.getCurriculum());
        report.setReportJson(req.getResultJson());
        report = reportRepo.save(report);

        return SkillGapDto.ReportSummary.builder()
                .id(report.getId())
                .targetRole(report.getTargetRole())
                .curriculum(report.getCurriculum())
                .generatedAt(report.getGeneratedAt())
                .build();
    }

    public List<SkillGapDto.ReportSummary> getSavedReports(User user) {
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
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));

        SkillGapReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new AppException("Report not found", HttpStatus.NOT_FOUND));

        if (!report.getStudent().getId().equals(student.getId())) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }

        return SkillGapDto.ReportDetail.builder()
                .id(report.getId())
                .targetRole(report.getTargetRole())
                .curriculum(report.getCurriculum())
                .reportJson(report.getReportJson())
                .generatedAt(report.getGeneratedAt())
                .build();
    }
}
