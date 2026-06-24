package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.JobPosting;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/industry-portal/dashboard")
@RequiredArgsConstructor
public class IndustryDashboardController {

    private final JobPostingRepository jobRepo;
    private final IndustrySmeRepository smeRepo;
    private final IndustryCampusInviteRepository campusRepo;
    private final IndustryPartnerRepository partnerRepo;
    private final UserRepository userRepo;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary(
            @AuthenticationPrincipal UserDetails ud) {
        var user = userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        IndustryPartner partner = partnerRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Partner not found", HttpStatus.NOT_FOUND));

        Map<String, Object> data = new LinkedHashMap<>();

        // Jobs stats
        long totalJobs = jobRepo.countByPartnerAndPostingType(partner, JobPosting.PostingType.JOB);
        long publishedJobs = jobRepo.countByPartnerAndStatus(partner, JobPosting.Status.PUBLISHED);
        long totalInternships = jobRepo.countByPartnerAndPostingType(partner, JobPosting.PostingType.INTERNSHIP);
        data.put("totalJobs", totalJobs);
        data.put("publishedJobs", publishedJobs);
        data.put("totalInternships", totalInternships);

        // SME stats
        long totalSme = smeRepo.countByPartner(partner);
        data.put("totalSme", totalSme);

        // Campus stats
        long totalCampusInvites = campusRepo.countByPartner(partner);
        data.put("totalCampusInvites", totalCampusInvites);

        // Home summary (upcoming counts — static for now until interview scheduling exists)
        data.put("upcomingInterviews", 0);
        data.put("campusRecruitmentRequests", totalCampusInvites);
        data.put("upcomingSmeSessions", 0);

        return ResponseEntity.ok(ApiResponse.ok(data, "OK"));
    }
}
