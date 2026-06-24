package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.CurriculumApprovalDto;
import com.hubblehox.e2j.entity.Curriculum;
import com.hubblehox.e2j.entity.CurriculumApproval;
import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.entity.Program;
import com.hubblehox.e2j.repository.CurriculumApprovalRepository;
import com.hubblehox.e2j.repository.CurriculumRepository;
import com.hubblehox.e2j.repository.ProgramRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bos")
@RequiredArgsConstructor
public class BosController {

    private final CurriculumApprovalRepository approvalRepo;
    private final CurriculumRepository         curriculumRepo;
    private final ProgramRepository            programRepo;

    /** Get curriculum file URLs for preview — BOS member must have an approval for it */
    @GetMapping("/curriculum/{curriculumId}/preview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurriculumPreview(
            @AuthenticationPrincipal User user,
            @PathVariable Long curriculumId) {
        boolean hasAccess = approvalRepo.findByBosUser(user).stream()
                .anyMatch(a -> a.getCurriculum().getId().equals(curriculumId));
        if (!hasAccess) throw new AppException("Not authorized", HttpStatus.FORBIDDEN);

        Curriculum c = curriculumRepo.findById(curriculumId)
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));

        Program p = c.getProgramId() != null
                ? programRepo.findById(c.getProgramId()).orElse(null)
                : null;

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "syllabusUrl",        p != null && p.getSyllabusUrl()        != null ? p.getSyllabusUrl()        : "",
                "creditStructureUrl", p != null && p.getCreditStructureUrl() != null ? p.getCreditStructureUrl() : "",
                "calendarUrl",        p != null && p.getCalendarUrl()        != null ? p.getCalendarUrl()        : "",
                "programName",        c.getProgramName()   != null ? c.getProgramName()   : "",
                "degree",             c.getDegree()        != null ? c.getDegree()        : "",
                "major",              c.getMajor()         != null ? c.getMajor()         : "",
                "academicYear",       c.getAcademicYear()  != null ? c.getAcademicYear()  : "",
                "approvalType",       c.getApprovalType()  != null ? c.getApprovalType()  : "ORIGINAL",
                "curriculumJson",     c.getCurriculumJson() != null ? c.getCurriculumJson() : ""
        )));
    }

    /** Get all approval tasks assigned to this BOS member */
    @GetMapping("/approvals")
    public ResponseEntity<ApiResponse<List<CurriculumApprovalDto>>> getMyApprovals(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                approvalRepo.findByBosUser(user).stream()
                        .map(CurriculumApprovalDto::from)
                        .toList()));
    }

    /** Approve or reject a curriculum — body: { decision: "APPROVED"|"REJECTED", remarks: "..." } */
    @PostMapping("/approvals/{id}/decide")
    public ResponseEntity<ApiResponse<CurriculumApprovalDto>> decide(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        CurriculumApproval approval = approvalRepo.findById(id)
                .orElseThrow(() -> new AppException("Approval not found", HttpStatus.NOT_FOUND));

        if (!approval.getBosUser().getId().equals(user.getId())) {
            throw new AppException("Not authorized", HttpStatus.FORBIDDEN);
        }

        CurriculumApproval.Decision decision = CurriculumApproval.Decision.valueOf(body.get("decision"));
        approval.setDecision(decision);
        approval.setRemarks(body.getOrDefault("remarks", ""));
        approval.setDecidedAt(LocalDateTime.now());
        approvalRepo.save(approval);

        Curriculum curriculum = approval.getCurriculum();

        if (decision == CurriculumApproval.Decision.REJECTED) {
            // Any rejection → immediately reject curriculum, go back to institute
            curriculum.setStatus(Curriculum.Status.REJECTED_BY_BOS);
            curriculum.setRejectionRemarks(approval.getRemarks());
            curriculumRepo.save(curriculum);
        } else {
            // Check if ALL BOS members have approved
            long total    = approvalRepo.countByCurriculum(curriculum);
            long approved = approvalRepo.countByCurriculumAndDecision(curriculum, CurriculumApproval.Decision.APPROVED);
            if (approved >= total && total > 0) {
                curriculum.setStatus(Curriculum.Status.APPROVED_BY_BOS);
                curriculumRepo.save(curriculum);
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(CurriculumApprovalDto.from(approval), "Decision recorded"));
    }
}
