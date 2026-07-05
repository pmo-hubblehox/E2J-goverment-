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
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long jobId) {
        return ResponseEntity.ok(ApiResponse.ok(jobApplicationService.listApplicants(ud.getUsername(), jobId)));
    }

    @GetMapping("/applicants/{id}")
    public ResponseEntity<ApiResponse<JobApplicationDto.ApplicantResponse>> getApplicant(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(jobApplicationService.getApplicant(ud.getUsername(), id)));
    }

    @PostMapping("/applicants/{id}/shortlist")
    public ResponseEntity<ApiResponse<JobApplicationDto.ApplicantResponse>> shortlist(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(jobApplicationService.shortlist(ud.getUsername(), id), "Candidate shortlisted"));
    }

    @PostMapping("/applicants/{id}/schedule-interview")
    public ResponseEntity<ApiResponse<JobApplicationDto.ApplicantResponse>> scheduleInterview(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long id,
            @RequestBody JobApplicationDto.ScheduleInterviewRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(jobApplicationService.scheduleInterview(ud.getUsername(), id, req), "Interview scheduled"));
    }

    @PostMapping("/applicants/{id}/feedback")
    public ResponseEntity<ApiResponse<JobApplicationDto.ApplicantResponse>> saveFeedback(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long id,
            @RequestBody JobApplicationDto.FeedbackRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(jobApplicationService.saveFeedback(ud.getUsername(), id, req), "Feedback saved"));
    }

    @PostMapping("/applicants/{id}/reject")
    public ResponseEntity<ApiResponse<JobApplicationDto.ApplicantResponse>> reject(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long id,
            @RequestBody JobApplicationDto.RejectRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(jobApplicationService.reject(ud.getUsername(), id, req), "Candidate rejected"));
    }

    @PostMapping("/applicants/{id}/offer-letter")
    public ResponseEntity<ApiResponse<JobApplicationDto.OfferLetterDto>> generateOffer(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long id,
            @RequestBody JobApplicationDto.OfferLetterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(jobApplicationService.generateOfferLetter(ud.getUsername(), id, req), "Offer letter generated"));
    }
}
