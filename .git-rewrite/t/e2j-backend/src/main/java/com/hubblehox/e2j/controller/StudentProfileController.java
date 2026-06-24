package com.hubblehox.e2j.controller;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hubblehox.e2j.dto.*;
import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.service.ResumeParserService;
import com.hubblehox.e2j.service.StudentProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/profile")
@RequiredArgsConstructor
public class StudentProfileController {

    private final StudentProfileService profileService;
    private final ResumeParserService resumeParserService;

    // ── Full Profile ──────────────────────────────────────────────────────

    @GetMapping("/full")
    public ResponseEntity<ApiResponse<StudentProfileDto>> getFullProfile(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.getFullProfile(user)));
    }

    // ── Step 2: Personal Information ──────────────────────────────────────

    @PutMapping("/personal")
    public ResponseEntity<ApiResponse<StudentProfileDto>> savePersonal(
            @AuthenticationPrincipal User user,
            @RequestBody StudentProfileDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                profileService.savePersonalInfo(user, dto), "Personal info saved"));
    }

    @PutMapping("/addresses")
    public ResponseEntity<ApiResponse<StudentProfileDto>> saveAddresses(
            @AuthenticationPrincipal User user,
            @RequestBody StudentProfileDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                profileService.saveAddresses(user, dto), "Addresses saved"));
    }

    @PutMapping("/social")
    public ResponseEntity<ApiResponse<StudentProfileDto>> saveSocial(
            @AuthenticationPrincipal User user,
            @RequestBody StudentProfileDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                profileService.saveSocialMedia(user, dto), "Social media saved"));
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<StudentProfileDto>> savePreferences(
            @AuthenticationPrincipal User user,
            @RequestBody StudentProfileDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                profileService.saveJobPreferences(user, dto), "Preferences saved"));
    }

    @PutMapping("/languages")
    public ResponseEntity<ApiResponse<StudentProfileDto>> saveLanguages(
            @AuthenticationPrincipal User user,
            @RequestBody List<PreferredLanguageDto> langs) {
        return ResponseEntity.ok(ApiResponse.ok(
                profileService.saveLanguages(user, langs), "Languages saved"));
    }

    @PutMapping("/salary")
    public ResponseEntity<ApiResponse<StudentProfileDto>> saveSalary(
            @AuthenticationPrincipal User user,
            @RequestBody StudentProfileDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                profileService.saveSalary(user, dto), "Salary expectations saved"));
    }

    @PutMapping("/skills")
    public ResponseEntity<ApiResponse<StudentProfileDto>> saveSkills(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, List<String>> body) {
        return ResponseEntity.ok(ApiResponse.ok(
                profileService.saveSkills(user, body.get("skills")), "Skills saved"));
    }

    // ── Step 4: Experience Summary ────────────────────────────────────────

    @PutMapping("/experience-summary")
    public ResponseEntity<ApiResponse<StudentProfileDto>> saveExperienceSummary(
            @AuthenticationPrincipal User user,
            @RequestBody StudentProfileDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                profileService.saveExperienceSummary(user, dto), "Experience summary saved"));
    }

    // ── Complete Profile ───────────────────────────────────────────────────

    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<StudentProfileDto>> completeProfile(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                profileService.completeProfile(user), "Profile completed"));
    }

    // ── Resumes ────────────────────────────────────────────────────────────

    @PostMapping("/resumes/parse")
    public ResponseEntity<ApiResponse<ObjectNode>> parseResume(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        String fileUrl = body.get("fileUrl");
        if (fileUrl == null || fileUrl.isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.error("fileUrl is required"));
        ObjectNode parsed = resumeParserService.parseFromFileUrl(fileUrl);
        return ResponseEntity.ok(ApiResponse.ok(parsed, "Resume parsed"));
    }

    @PostMapping("/resumes")
    public ResponseEntity<ApiResponse<ResumeDto>> addResume(
            @AuthenticationPrincipal User user,
            @RequestBody ResumeDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.addResume(user, dto), "Resume saved"));
    }

    @PutMapping("/resumes/{id}/primary")
    public ResponseEntity<ApiResponse<Void>> setPrimaryResume(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        profileService.setPrimaryResume(user, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Primary resume updated"));
    }

    @DeleteMapping("/resumes/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResume(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        profileService.deleteResume(user, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Resume deleted"));
    }

    // ── Education ──────────────────────────────────────────────────────────

    @PostMapping("/educations")
    public ResponseEntity<ApiResponse<EducationDto>> addEducation(
            @AuthenticationPrincipal User user,
            @RequestBody EducationDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.addEducation(user, dto), "Education added"));
    }

    @PutMapping("/educations/{id}")
    public ResponseEntity<ApiResponse<EducationDto>> updateEducation(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody EducationDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.updateEducation(user, id, dto), "Education updated"));
    }

    @DeleteMapping("/educations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEducation(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        profileService.deleteEducation(user, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Education deleted"));
    }

    // ── Certifications ─────────────────────────────────────────────────────

    @PostMapping("/certifications")
    public ResponseEntity<ApiResponse<CertificationDto>> addCertification(
            @AuthenticationPrincipal User user,
            @RequestBody CertificationDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.addCertification(user, dto), "Certification added"));
    }

    @PutMapping("/certifications/{id}")
    public ResponseEntity<ApiResponse<CertificationDto>> updateCertification(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody CertificationDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.updateCertification(user, id, dto), "Certification updated"));
    }

    @DeleteMapping("/certifications/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCertification(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        profileService.deleteCertification(user, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Certification deleted"));
    }

    // ── Work Experience ────────────────────────────────────────────────────

    @PostMapping("/work-experiences")
    public ResponseEntity<ApiResponse<WorkExperienceDto>> addWorkExperience(
            @AuthenticationPrincipal User user,
            @RequestBody WorkExperienceDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.addWorkExperience(user, dto), "Work experience added"));
    }

    @PutMapping("/work-experiences/{id}")
    public ResponseEntity<ApiResponse<WorkExperienceDto>> updateWorkExperience(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody WorkExperienceDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.updateWorkExperience(user, id, dto), "Work experience updated"));
    }

    @DeleteMapping("/work-experiences/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkExperience(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        profileService.deleteWorkExperience(user, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Work experience deleted"));
    }
}
