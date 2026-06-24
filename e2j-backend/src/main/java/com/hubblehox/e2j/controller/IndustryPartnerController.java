package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.IndustryPartnerDto;
import com.hubblehox.e2j.service.IndustryPartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/industry-partner")
@RequiredArgsConstructor
public class IndustryPartnerController {

    private final IndustryPartnerService industryPartnerService;

    // Get the full application profile
    @GetMapping("/application")
    public ResponseEntity<ApiResponse<IndustryPartnerDto.ApplicationResponse>> getApplication(
            @AuthenticationPrincipal UserDetails userDetails) {
        IndustryPartnerDto.ApplicationResponse response =
                industryPartnerService.getApplication(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(response, "Application fetched"));
    }

    // Save / update application data (wizard step save)
    @PutMapping("/application")
    public ResponseEntity<ApiResponse<IndustryPartnerDto.ApplicationResponse>> saveApplication(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody IndustryPartnerDto.ApplicationRequest req) {
        IndustryPartnerDto.ApplicationResponse response =
                industryPartnerService.saveApplication(userDetails.getUsername(), req);
        return ResponseEntity.ok(ApiResponse.ok(response, "Application saved"));
    }

    // Submit application for approval
    @PostMapping("/application/submit")
    public ResponseEntity<ApiResponse<IndustryPartnerDto.StatusResponse>> submitApplication(
            @AuthenticationPrincipal UserDetails userDetails) {
        IndustryPartnerDto.StatusResponse response =
                industryPartnerService.submitApplication(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(response, "Application submitted for approval"));
    }

    // Check onboarding completion (used by login redirect logic)
    @GetMapping("/onboarding/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOnboardingStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean completed = industryPartnerService.isOnboardingCompleted(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("onboardingCompleted", completed), "OK"));
    }

    // Get application status only
    @GetMapping("/application/status")
    public ResponseEntity<ApiResponse<IndustryPartnerDto.StatusResponse>> getStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        IndustryPartnerDto.StatusResponse response =
                industryPartnerService.getStatus(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(response, "Status fetched"));
    }
}
