package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.IndustryPartnerDto;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import com.hubblehox.e2j.service.PsychometricService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/verifier")
@RequiredArgsConstructor
public class VerifierController {

    private final IndustryPartnerRepository      industryPartnerRepository;
    private final InstituteRepository            instituteRepository;
    private final ProgramRepository              programRepository;
    private final FacultyRepository              facultyRepository;
    private final InstituteStudentRepository     studentRepository;
    private final InstituteInfraRepository       infraRepository;
    private final BosMemberRepository            bosMemberRepository;
    private final CurriculumRepository           curriculumRepository;
    private final PsychometricQuestionRepository psychometricQuestionRepository;
    private final PsychometricService            psychometricService;

    /** List all industry-partner applications that are pending review */
    @GetMapping("/industry-partners")
    public ResponseEntity<ApiResponse<List<IndustryPartnerDto.ApplicationResponse>>> listApplications() {
        List<IndustryPartner> all = industryPartnerRepository.findAll().stream()
                .filter(p -> p.getApplicationStatus() != IndustryPartner.ApplicationStatus.DRAFT)
                .toList();
        List<IndustryPartnerDto.ApplicationResponse> body = all.stream()
                .map(IndustryPartnerDto::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(body, "Applications fetched"));
    }

    /** Approve an industry-partner application */
    @PutMapping("/industry-partners/{id}/approve")
    public ResponseEntity<ApiResponse<IndustryPartnerDto.StatusResponse>> approve(@PathVariable Long id) {
        IndustryPartner partner = findById(id);
        partner.setApplicationStatus(IndustryPartner.ApplicationStatus.APPROVED);
        industryPartnerRepository.save(partner);
        return ResponseEntity.ok(ApiResponse.ok(toStatus(partner), "Application approved"));
    }

    /** Reject an industry-partner application with an optional reason */
    @PutMapping("/industry-partners/{id}/reject")
    public ResponseEntity<ApiResponse<IndustryPartnerDto.StatusResponse>> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        IndustryPartner partner = findById(id);
        partner.setApplicationStatus(IndustryPartner.ApplicationStatus.REJECTED);
        partner.setRejectionReason(body.getOrDefault("reason", ""));
        industryPartnerRepository.save(partner);
        return ResponseEntity.ok(ApiResponse.ok(toStatus(partner), "Application rejected"));
    }

    /** Move application to UNDER_REVIEW */
    @PutMapping("/industry-partners/{id}/under-review")
    public ResponseEntity<ApiResponse<IndustryPartnerDto.StatusResponse>> underReview(@PathVariable Long id) {
        IndustryPartner partner = findById(id);
        partner.setApplicationStatus(IndustryPartner.ApplicationStatus.UNDER_REVIEW);
        industryPartnerRepository.save(partner);
        return ResponseEntity.ok(ApiResponse.ok(toStatus(partner), "Marked as under review"));
    }

    private IndustryPartner findById(Long id) {
        return industryPartnerRepository.findById(id)
                .orElseThrow(() -> new AppException("Application not found", HttpStatus.NOT_FOUND));
    }

    private IndustryPartnerDto.StatusResponse toStatus(IndustryPartner p) {
        return IndustryPartnerDto.StatusResponse.builder()
                .applicationStatus(p.getApplicationStatus().name())
                .submittedAt(p.getSubmittedAt())
                .rejectionReason(p.getRejectionReason())
                .build();
    }

    // ── Institute endpoints ───────────────────────────────────────────────────

    @GetMapping("/institutes")
    public ResponseEntity<ApiResponse<List<Institute>>> listInstitutes() {
        List<Institute> list = instituteRepository.findAll().stream()
                .filter(i -> i.getStatus() != Institute.Status.PENDING)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(list, "Institutes fetched"));
    }

    @PutMapping("/institutes/{id}/approve")
    public ResponseEntity<ApiResponse<Map<String, String>>> approveInstitute(@PathVariable Long id) {
        Institute inst = instituteRepository.findById(id)
                .orElseThrow(() -> new AppException("Institute not found", HttpStatus.NOT_FOUND));
        inst.setStatus(Institute.Status.APPROVED);
        instituteRepository.save(inst);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "APPROVED"), "Institute approved"));
    }

    @PutMapping("/institutes/{id}/reject")
    public ResponseEntity<ApiResponse<Map<String, String>>> rejectInstitute(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Institute inst = instituteRepository.findById(id)
                .orElseThrow(() -> new AppException("Institute not found", HttpStatus.NOT_FOUND));
        inst.setStatus(Institute.Status.REJECTED);
        instituteRepository.save(inst);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "REJECTED"), "Institute rejected"));
    }

    @PutMapping("/institutes/{id}/under-review")
    public ResponseEntity<ApiResponse<Map<String, String>>> underReviewInstitute(@PathVariable Long id) {
        Institute inst = instituteRepository.findById(id)
                .orElseThrow(() -> new AppException("Institute not found", HttpStatus.NOT_FOUND));
        inst.setStatus(Institute.Status.UNDER_REVIEW);
        instituteRepository.save(inst);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "UNDER_REVIEW"), "Marked as under review"));
    }

    @GetMapping("/institutes/{id}/programs")
    public ResponseEntity<ApiResponse<List<Program>>> getInstitutePrograms(@PathVariable Long id) {
        Institute inst = instituteRepository.findById(id)
                .orElseThrow(() -> new AppException("Institute not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(programRepository.findByInstitute(inst, PageRequest.of(0, 200)).getContent()));
    }

    @GetMapping("/institutes/{id}/faculty")
    public ResponseEntity<ApiResponse<List<Faculty>>> getInstituteFaculty(@PathVariable Long id) {
        Institute inst = instituteRepository.findById(id)
                .orElseThrow(() -> new AppException("Institute not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(facultyRepository.findByInstitute(inst, PageRequest.of(0, 200)).getContent()));
    }

    @GetMapping("/institutes/{id}/students")
    public ResponseEntity<ApiResponse<List<InstituteStudent>>> getInstituteStudents(@PathVariable Long id) {
        Institute inst = instituteRepository.findById(id)
                .orElseThrow(() -> new AppException("Institute not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(studentRepository.findByInstitute(inst, PageRequest.of(0, 500)).getContent()));
    }

    @GetMapping("/institutes/{id}/infra")
    public ResponseEntity<ApiResponse<InstituteInfra>> getInstituteInfra(@PathVariable Long id) {
        Institute inst = instituteRepository.findById(id)
                .orElseThrow(() -> new AppException("Institute not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(infraRepository.findByInstitute(inst).orElse(null)));
    }

    @GetMapping("/institutes/{id}/bos")
    public ResponseEntity<ApiResponse<List<BosMember>>> getInstituteBos(@PathVariable Long id) {
        Institute inst = instituteRepository.findById(id)
                .orElseThrow(() -> new AppException("Institute not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(bosMemberRepository.findByInstitute(inst)));
    }

    // ── Curriculum approvals (Verifier = final HOD sign-off) ─────────────────

    /** All curricula waiting for verifier final approval (status = APPROVED_BY_BOS) */
    @GetMapping("/curriculum/pending")
    public ResponseEntity<ApiResponse<List<Curriculum>>> getPendingCurricula() {
        List<Curriculum> pending = curriculumRepository.findAll().stream()
                .filter(c -> c.getStatus() == Curriculum.Status.APPROVED_BY_BOS)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(pending, "Pending curricula"));
    }

    @PostMapping("/curriculum/{id}/approve")
    public ResponseEntity<ApiResponse<Curriculum>> approveCurriculum(@PathVariable Long id) {
        Curriculum c = curriculumRepository.findById(id)
                .orElseThrow(() -> new AppException("Curriculum not found", HttpStatus.NOT_FOUND));
        c.setStatus(Curriculum.Status.APPROVED);
        curriculumRepository.save(c);
        return ResponseEntity.ok(ApiResponse.ok(c, "Curriculum approved"));
    }

    @PostMapping("/curriculum/{id}/reject")
    public ResponseEntity<ApiResponse<Curriculum>> rejectCurriculum(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Curriculum c = curriculumRepository.findById(id)
                .orElseThrow(() -> new AppException("Curriculum not found", HttpStatus.NOT_FOUND));
        c.setStatus(Curriculum.Status.REJECTED_BY_VERIFIER);
        c.setRejectionRemarks(body.getOrDefault("remarks", ""));
        curriculumRepository.save(c);
        return ResponseEntity.ok(ApiResponse.ok(c, "Curriculum rejected"));
    }

    // ── Psychometric Questions ────────────────────────────────────────────────

    @PostMapping("/psychometric/questions/upload")
    public ResponseEntity<ApiResponse<String>> uploadQuestions(@RequestParam("file") MultipartFile file) {
        try {
            int count = psychometricService.bulkUploadQuestions(file);
            return ResponseEntity.ok(ApiResponse.ok(count + " questions uploaded successfully"));
        } catch (Exception e) {
            throw new AppException("Failed to upload questions: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/psychometric/questions")
    public ResponseEntity<ApiResponse<List<PsychometricQuestion>>> listQuestions() {
        return ResponseEntity.ok(ApiResponse.ok(psychometricQuestionRepository.findAll()));
    }

    @DeleteMapping("/psychometric/questions/{id}")
    public ResponseEntity<ApiResponse<String>> deleteQuestion(@PathVariable Long id) {
        psychometricQuestionRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Question deleted"));
    }

    @GetMapping("/psychometric/questions/sample")
    public ResponseEntity<byte[]> sampleExcel() {
        try {
            byte[] bytes = psychometricService.generateSampleExcel();
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=psychometric_questions_sample.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(bytes);
        } catch (Exception e) {
            throw new AppException("Failed to generate sample", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
