package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.WorkshopEnrollmentDto;
import com.hubblehox.e2j.dto.WorkshopPostingDto;
import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.WorkshopPosting;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.IndustryPartnerRepository;
import com.hubblehox.e2j.dto.WorkshopReviewDto;
import com.hubblehox.e2j.service.WorkshopEnrollmentService;
import com.hubblehox.e2j.service.WorkshopPostingService;
import com.hubblehox.e2j.service.WorkshopReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/industry-portal/workshops")
@RequiredArgsConstructor
public class IndustryWorkshopController {

    private final WorkshopPostingService workshopService;
    private final WorkshopEnrollmentService enrollmentService;
    private final WorkshopReviewService reviewService;
    private final IndustryPartnerRepository partnerRepo;

    private IndustryPartner getPartner(String email) {
        return partnerRepo.findByUser_Email(email)
                .orElseThrow(() -> new AppException("Partner not found", HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkshopPostingDto.Response>> create(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody WorkshopPostingDto.CreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                workshopService.createForIndustry(getPartner(ud.getUsername()), req), "Workshop submitted for approval"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkshopPostingDto.Response>>> list(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(workshopService.listForIndustry(getPartner(ud.getUsername()))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkshopPostingDto.Response>> update(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestBody WorkshopPostingDto.CreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                workshopService.updateForIndustry(getPartner(ud.getUsername()), id, req), "Workshop updated and resubmitted for approval"));
    }

    @GetMapping("/{id}/enrollments")
    public ResponseEntity<ApiResponse<List<WorkshopEnrollmentDto.RosterRow>>> enrollments(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long id) {
        IndustryPartner partner = getPartner(ud.getUsername());
        WorkshopPosting workshop = workshopService.findById(id);
        if (workshop.getIndustryPartner() == null || !workshop.getIndustryPartner().getId().equals(partner.getId()))
            throw new AppException("Unauthorized", HttpStatus.FORBIDDEN);
        return ResponseEntity.ok(ApiResponse.ok(enrollmentService.rosterForWorkshop(workshop)));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse<List<WorkshopReviewDto.Response>>> reviews(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long id) {
        IndustryPartner partner = getPartner(ud.getUsername());
        WorkshopPosting workshop = workshopService.findById(id);
        if (workshop.getIndustryPartner() == null || !workshop.getIndustryPartner().getId().equals(partner.getId()))
            throw new AppException("Unauthorized", HttpStatus.FORBIDDEN);
        return ResponseEntity.ok(ApiResponse.ok(reviewService.forWorkshop(id)));
    }
}
