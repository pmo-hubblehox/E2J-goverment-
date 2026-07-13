package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.WorkshopEnrollmentDto;
import com.hubblehox.e2j.dto.WorkshopPostingDto;
import com.hubblehox.e2j.dto.WorkshopReviewDto;
import com.hubblehox.e2j.service.WorkshopEnrollmentService;
import com.hubblehox.e2j.service.WorkshopPostingService;
import com.hubblehox.e2j.service.WorkshopReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class StudentWorkshopController {

    private final WorkshopPostingService workshopService;
    private final WorkshopEnrollmentService enrollmentService;
    private final WorkshopReviewService reviewService;

    @GetMapping("/student/workshops")
    public ResponseEntity<ApiResponse<List<WorkshopPostingDto.Response>>> browse(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(ApiResponse.ok(workshopService.browseForStudent(ud.getUsername(), mode, scope, role)));
    }

    @GetMapping("/student/workshops/{id}")
    public ResponseEntity<ApiResponse<WorkshopPostingDto.Response>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(workshopService.getDetail(id)));
    }

    @PostMapping("/student/workshops/{id}/enroll")
    public ResponseEntity<ApiResponse<WorkshopEnrollmentDto.Response>> enroll(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestBody WorkshopEnrollmentDto.EnrollRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                enrollmentService.enroll(ud.getUsername(), id, req.getFormAnswer()), "Enrollment submitted"));
    }

    @GetMapping("/student/workshop-enrollments")
    public ResponseEntity<ApiResponse<List<WorkshopEnrollmentDto.Response>>> myEnrollments(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(enrollmentService.myEnrollments(ud.getUsername())));
    }

    @PostMapping("/student/workshop-enrollments/{id}/cancel")
    public ResponseEntity<ApiResponse<WorkshopEnrollmentDto.Response>> cancel(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(enrollmentService.cancel(ud.getUsername(), id), "Enrollment cancelled"));
    }

    @PostMapping("/student/workshop-enrollments/{id}/review")
    public ResponseEntity<ApiResponse<WorkshopReviewDto.Response>> review(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestBody WorkshopReviewDto.SubmitRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.submit(ud.getUsername(), id, req), "Review submitted"));
    }
}
