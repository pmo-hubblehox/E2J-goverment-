package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.JobApplicationDto;
import com.hubblehox.e2j.service.JobApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/industry-portal")
@RequiredArgsConstructor
public class IndustryApplicantController {

    private final JobApplicationService jobApplicationService;

    @GetMapping("/applicants")
    public ResponseEntity<ApiResponse<List<JobApplicationDto.ApplicantResponse>>> listAll(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(jobApplicationService.listAllApplicants(ud.getUsername())));
    }

    @GetMapping("/jobs/{jobId}/applicants")
    public ResponseEntity<ApiResponse<List<JobApplicationDto.ApplicantResponse>>> listForJob(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long jobId) {
        return ResponseEntity.ok(ApiResponse.ok(jobApplicationService.listApplicants(ud.getUsername(), jobId)));
    }

    @PatchMapping("/applicants/{id}/stage")
    public ResponseEntity<ApiResponse<JobApplicationDto.ApplicantResponse>> updateStage(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(
                jobApplicationService.updateStage(ud.getUsername(), id, body.get("stage")), "Stage updated"));
    }
}
