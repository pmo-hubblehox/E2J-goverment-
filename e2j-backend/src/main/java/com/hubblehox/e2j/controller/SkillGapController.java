package com.hubblehox.e2j.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.SkillGapDto;
import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.service.GroqService;
import com.hubblehox.e2j.service.SkillGapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/skill-gap")
@RequiredArgsConstructor
public class SkillGapController {

    private final SkillGapService skillGapService;
    private final GroqService groqService;
    private final ObjectMapper objectMapper;

    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<SkillGapDto.AnalyzeResponse>> startAnalysis(
            @AuthenticationPrincipal User user,
            @RequestBody SkillGapDto.AnalyzeRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                skillGapService.startAnalysis(user, req.getTargetRole()), "Analysis started"));
    }

    @GetMapping("/status/{taskId}")
    public ResponseEntity<ApiResponse<SkillGapDto.StatusResponse>> getStatus(
            @PathVariable String taskId) {
        return ResponseEntity.ok(ApiResponse.ok(skillGapService.getStatus(taskId)));
    }

    @GetMapping("/result/{taskId}")
    public ResponseEntity<ApiResponse<JsonNode>> getResult(
            @PathVariable String taskId) throws Exception {
        String raw = skillGapService.getResult(taskId);
        JsonNode node = objectMapper.readTree(raw);
        return ResponseEntity.ok(ApiResponse.ok(node));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<SkillGapDto.ReportSummary>> saveReport(
            @AuthenticationPrincipal User user,
            @RequestBody SkillGapDto.SaveRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                skillGapService.saveReport(user, req), "Report saved"));
    }

    @DeleteMapping("/analyze/{taskId}")
    public ResponseEntity<ApiResponse<String>> cancelAnalysis(
            @PathVariable String taskId) {
        skillGapService.cancelAnalysis(taskId);
        return ResponseEntity.ok(ApiResponse.ok("Cancelled", "Analysis cancelled"));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<SkillGapDto.ReportSummary>>> getSavedReports(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(skillGapService.getSavedReports(user)));
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<ApiResponse<SkillGapDto.ReportDetail>> getReportById(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(skillGapService.getReportById(user, id)));
    }

    @GetMapping("/trending-roles")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTrendingRoles(
            @RequestParam String targetRole) throws Exception {

        String prompt = String.format("""
                You are a job market analyst specializing in India's tech and education sector.
                For someone targeting the role "%s", list the top 5 most in-demand and trending related job roles in 2025.
                For each role include: title, demand score (0-100 integer), and dominant skill category (one of: Knowledge, Practical, Soft Skills).

                Return ONLY this JSON — no explanation, no markdown:
                {
                  "roles": [
                    {"title": "Role Name", "demand": 94, "category": "Knowledge"},
                    {"title": "Role Name", "demand": 88, "category": "Practical"},
                    {"title": "Role Name", "demand": 82, "category": "Soft Skills"},
                    {"title": "Role Name", "demand": 75, "category": "Knowledge"},
                    {"title": "Role Name", "demand": 70, "category": "Practical"}
                  ]
                }
                """, targetRole);

        String raw = groqService.chat(List.of(
                new GroqService.Message("system", "You are a job market analyst. Always respond in valid JSON only."),
                new GroqService.Message("user", prompt)
        ));

        JsonNode root = objectMapper.readTree(raw);
        List<Map<String, Object>> roles = new ArrayList<>();
        root.path("roles").forEach(r -> roles.add(Map.of(
                "title", r.path("title").asText(),
                "demand", r.path("demand").asInt(),
                "category", r.path("category").asText()
        )));

        return ResponseEntity.ok(ApiResponse.ok(roles));
    }
}
