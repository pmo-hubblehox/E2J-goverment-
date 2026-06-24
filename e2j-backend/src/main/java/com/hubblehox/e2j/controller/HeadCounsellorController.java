package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

@RestController
@RequestMapping("/head-counsellor")
@RequiredArgsConstructor
public class HeadCounsellorController {

    private final CounsellorRepository counsellorRepo;
    private final CounsellorEducationRepository educationRepo;
    private final CounsellorWorkExperienceRepository workExpRepo;
    private final CounsellorCertificationRepository certRepo;

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<Counsellor>>> getPending(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
            counsellorRepo.findByOnboardingCompletedTrueAndStatus(Counsellor.Status.PENDING)
        ));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<Counsellor>>> getApproved(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
            counsellorRepo.findByStatus(Counsellor.Status.APPROVED)
        ));
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(
            @PathVariable Long id, @AuthenticationPrincipal User user) {
        Counsellor c = counsellorRepo.findById(id)
                .orElseThrow(() -> new AppException("Counsellor not found", HttpStatus.NOT_FOUND));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("counsellor", c);
        result.put("education", educationRepo.findByCounsellor(c));
        result.put("workExperience", workExpRepo.findByCounsellor(c));
        result.put("certifications", certRepo.findByCounsellor(c));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/profile-updates")
    public ResponseEntity<ApiResponse<List<Counsellor>>> getPendingProfileUpdates(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(counsellorRepo.findByPendingProfileUpdateTrue()));
    }

    @PutMapping("/{id}/approve-profile-update")
    public ResponseEntity<ApiResponse<Counsellor>> approveProfileUpdate(
            @PathVariable Long id, @AuthenticationPrincipal User user) {
        Counsellor c = counsellorRepo.findById(id)
                .orElseThrow(() -> new AppException("Counsellor not found", HttpStatus.NOT_FOUND));
        String raw = c.getPendingData();
        if (raw != null && !raw.isBlank()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> data = mapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
                if (data.containsKey("phone"))              c.setPhone(str(data, "phone"));
                if (data.containsKey("gender"))             c.setGender(str(data, "gender"));
                if (data.containsKey("differentlyAbled"))   c.setDifferentlyAbled(str(data, "differentlyAbled"));
                if (data.containsKey("remarks"))            c.setRemarks(str(data, "remarks"));
                if (data.containsKey("houseNumber"))        c.setHouseNumber(str(data, "houseNumber"));
                if (data.containsKey("flatNumber"))         c.setFlatNumber(str(data, "flatNumber"));
                if (data.containsKey("country"))            c.setCountry(str(data, "country"));
                if (data.containsKey("pincode"))            c.setPincode(str(data, "pincode"));
                if (data.containsKey("state"))              c.setState(str(data, "state"));
                if (data.containsKey("city"))               c.setCity(str(data, "city"));
                if (data.containsKey("area"))               c.setArea(str(data, "area"));
                if (data.containsKey("landmark"))           c.setLandmark(str(data, "landmark"));
                if (data.containsKey("linkedinUrl"))        c.setLinkedinUrl(str(data, "linkedinUrl"));
                if (data.containsKey("githubUrl"))          c.setGithubUrl(str(data, "githubUrl"));
                if (data.containsKey("experienceCategory")) c.setExperienceCategory(str(data, "experienceCategory"));
                if (data.containsKey("experienceYears"))    { Object v = data.get("experienceYears"); if (v instanceof Number n) c.setExperienceYears(n.intValue()); }
                if (data.containsKey("experienceMonths"))   { Object v = data.get("experienceMonths"); if (v instanceof Number n) c.setExperienceMonths(n.intValue()); }
                if (data.containsKey("skills"))             { Object v = data.get("skills"); if (v instanceof List<?> l) c.setSkills(new ArrayList<>(l.stream().map(Object::toString).toList())); }
                if (data.containsKey("languages"))          { Object v = data.get("languages"); if (v instanceof List<?> l) c.setLanguages(new ArrayList<>(l.stream().map(Object::toString).toList())); }
            } catch (Exception e) {
                throw new AppException("Failed to apply pending profile data: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        c.setPendingProfileUpdate(false);
        c.setPendingData(null);
        return ResponseEntity.ok(ApiResponse.ok(counsellorRepo.save(c)));
    }

    private String str(Map<String, Object> data, String key) {
        Object v = data.get(key);
        return v != null ? v.toString() : null;
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Counsellor>> approve(
            @PathVariable Long id, @AuthenticationPrincipal User user) {
        Counsellor c = counsellorRepo.findById(id)
                .orElseThrow(() -> new AppException("Counsellor not found", HttpStatus.NOT_FOUND));
        c.setStatus(Counsellor.Status.APPROVED);
        c.setRejectionReason(null);
        return ResponseEntity.ok(ApiResponse.ok(counsellorRepo.save(c)));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Counsellor>> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        Counsellor c = counsellorRepo.findById(id)
                .orElseThrow(() -> new AppException("Counsellor not found", HttpStatus.NOT_FOUND));
        c.setStatus(Counsellor.Status.REJECTED);
        c.setRejectionReason(body.getOrDefault("reason", ""));
        return ResponseEntity.ok(ApiResponse.ok(counsellorRepo.save(c)));
    }
}
