package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.JobApplicationDto;
import com.hubblehox.e2j.dto.JobPostingDto;
import com.hubblehox.e2j.service.JobApplicationService;
import com.hubblehox.e2j.service.JobPostingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentJobController {

    private final JobPostingService jobPostingService;
    private final JobApplicationService jobApplicationService;

    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<List<JobPostingDto.Response>>> listJobs() {
        return ResponseEntity.ok(ApiResponse.ok(jobPostingService.listPublished()));
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<ApiResponse<JobPostingDto.Response>> getJob(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(jobPostingService.getPublished(id)));
    }

    @PostMapping("/jobs/{id}/apply")
    public ResponseEntity<ApiResponse<JobApplicationDto.Response>> apply(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestBody JobApplicationDto.ApplyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                jobApplicationService.apply(ud.getUsername(), id, req), "Application submitted successfully"));
    }

    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<List<JobApplicationDto.Response>>> myApplications(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(jobApplicationService.myApplications(ud.getUsername())));
    }

    @GetMapping("/jobs/{id}/applied")
    public ResponseEntity<ApiResponse<Boolean>> hasApplied(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(jobApplicationService.hasApplied(ud.getUsername(), id)));
    }

    @PatchMapping("/applications/{id}/offer/respond")
    public ResponseEntity<ApiResponse<JobApplicationDto.OfferLetterDto>> respondToOffer(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(
                jobApplicationService.respondToOffer(ud.getUsername(), id, body.get("response")),
                "Response recorded"));
    }
}
