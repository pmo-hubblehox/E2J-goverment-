package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import com.hubblehox.e2j.service.PsychometricService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/student/psychometric")
@RequiredArgsConstructor
public class PsychometricController {

    private final PsychometricService        psychometricService;
    private final PsychometricReportRepository reportRepo;
    private final StudentRepository          studentRepo;

    private Student getStudent(User user) {
        return studentRepo.findByUser(user)
            .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
    }

    /** Get 30 adaptive questions for the logged-in student */
    @GetMapping("/questions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getQuestions(
            @AuthenticationPrincipal User user) {
        Student student = getStudent(user);
        return ResponseEntity.ok(ApiResponse.ok(psychometricService.getQuestions(student)));
    }

    /**
     * Submit answers and get back the scored report.
     * Body: { "answers": {"questionId": score, ...}, "aspirationId": 123 }
     */
    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submit(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {

        Student student = getStudent(user);

        @SuppressWarnings("unchecked")
        Map<String, Object> rawAnswers = (Map<String, Object>) body.get("answers");
        if (rawAnswers == null || rawAnswers.isEmpty())
            throw new AppException("Answers are required", HttpStatus.BAD_REQUEST);

        Map<Long, Integer> answers = rawAnswers.entrySet().stream()
            .collect(Collectors.toMap(
                e -> Long.parseLong(e.getKey()),
                e -> ((Number) e.getValue()).intValue()
            ));

        Long aspirationId = body.containsKey("aspirationId") && body.get("aspirationId") != null
            ? ((Number) body.get("aspirationId")).longValue() : null;

        PsychometricReport report = psychometricService.submitAndScore(student, answers, aspirationId);
        return ResponseEntity.ok(ApiResponse.ok(psychometricService.reportToMap(report)));
    }

    /** Get a specific report by ID */
    @GetMapping("/reports/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReport(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {

        Student student = getStudent(user);
        PsychometricReport report = reportRepo.findById(id)
            .orElseThrow(() -> new AppException("Report not found", HttpStatus.NOT_FOUND));

        if (!report.getStudent().getId().equals(student.getId()))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);

        return ResponseEntity.ok(ApiResponse.ok(psychometricService.reportToMap(report)));
    }

    /** List all reports for the logged-in student */
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listReports(
            @AuthenticationPrincipal User user) {
        Student student = getStudent(user);
        List<Map<String, Object>> reports = reportRepo
            .findByStudentOrderByCreatedAtDesc(student)
            .stream()
            .map(psychometricService::reportToMap)
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }
}
