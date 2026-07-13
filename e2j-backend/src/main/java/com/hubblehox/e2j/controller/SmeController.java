package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.WorkshopPostingDto;
import com.hubblehox.e2j.dto.WorkshopReviewDto;
import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.entity.WorkshopEnrollment;
import com.hubblehox.e2j.entity.WorkshopPosting;
import com.hubblehox.e2j.entity.WorkshopTrainer;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.WorkshopEnrollmentRepository;
import com.hubblehox.e2j.repository.WorkshopPostingRepository;
import com.hubblehox.e2j.repository.WorkshopTrainerRepository;
import com.hubblehox.e2j.service.WorkshopPostingService;
import com.hubblehox.e2j.service.WorkshopReviewService;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sme")
@RequiredArgsConstructor
public class SmeController {

    private final WorkshopTrainerRepository trainerRepo;
    private final WorkshopPostingRepository workshopRepo;
    private final WorkshopEnrollmentRepository enrollmentRepo;
    private final WorkshopPostingService workshopPostingService;
    private final WorkshopReviewService workshopReviewService;

    private WorkshopTrainer getTrainer(User user) {
        return trainerRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Trainer profile not found", HttpStatus.NOT_FOUND));
    }

    private WorkshopPosting getOwnedWorkshop(User user, Long workshopId) {
        WorkshopTrainer trainer = getTrainer(user);
        WorkshopPosting workshop = workshopRepo.findById(workshopId)
                .orElseThrow(() -> new AppException("Workshop not found", HttpStatus.NOT_FOUND));
        if (workshop.getTrainer() == null || !workshop.getTrainer().getId().equals(trainer.getId()))
            throw new AppException("Unauthorized", HttpStatus.FORBIDDEN);
        return workshop;
    }

    @GetMapping("/workshops")
    public ResponseEntity<ApiResponse<List<WorkshopPostingDto.Response>>> myWorkshops(
            @AuthenticationPrincipal User user) {
        List<WorkshopPosting> assigned = workshopRepo.findByTrainerOrderByCreatedAtDesc(getTrainer(user));
        return ResponseEntity.ok(ApiResponse.ok(assigned.stream()
                .map(w -> workshopPostingService.getDetail(w.getId())).toList()));
    }

    @GetMapping("/workshops/{id}/roster")
    public ResponseEntity<ApiResponse<List<RosterRow>>> roster(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        WorkshopPosting workshop = getOwnedWorkshop(user, id);
        List<RosterRow> rows = enrollmentRepo.findByWorkshopOrderByCreatedAtAsc(workshop).stream()
                .filter(e -> e.getStatus() != WorkshopEnrollment.Status.CANCELLED)
                .map(e -> RosterRow.builder()
                        .studentName(e.getStudent().getUser() != null ? e.getStudent().getUser().getName() : null)
                        .studentEmail(e.getStudent().getUser() != null ? e.getStudent().getUser().getEmail() : null)
                        .status(e.getStatus().name())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(rows));
    }

    @GetMapping("/workshops/{id}/reviews")
    public ResponseEntity<ApiResponse<List<WorkshopReviewDto.Response>>> reviews(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        getOwnedWorkshop(user, id);
        return ResponseEntity.ok(ApiResponse.ok(workshopReviewService.forWorkshop(id)));
    }

    @Getter @Builder
    public static class RosterRow {
        private String studentName;
        private String studentEmail;
        private String status;
    }
}
