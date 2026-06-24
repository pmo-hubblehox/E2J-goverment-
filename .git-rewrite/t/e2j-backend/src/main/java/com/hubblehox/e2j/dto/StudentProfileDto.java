package com.hubblehox.e2j.dto;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentProfileDto {

    // ── Personal Information ─────────────────────────────────────────────
    private String title;
    private String firstName;
    private String middleName;
    private String lastName;
    private String dob;
    private String gender;
    private String nationality;
    private String maritalStatus;
    private String physChallenged;
    private String remark;
    private String mobilePrimary;
    private String mobileAlternate;
    private String email;
    private String alternateEmail;
    private String photoUrl;

    // ── Addresses ────────────────────────────────────────────────────────
    private AddressDto presentAddress;
    private AddressDto permanentAddress;
    private boolean sameAddress;

    // ── Social Media ─────────────────────────────────────────────────────
    private String linkedinUrl;
    private String portfolioUrl;
    private String websiteUrl;

    // ── Preferences ──────────────────────────────────────────────────────
    private List<String> preferredJobRoles;
    private List<String> preferredLocations;
    private List<PreferredLanguageDto> preferredLanguages;

    // ── Salary Expectations ──────────────────────────────────────────────
    private Long annualCtc;
    private Long variableCtc;
    private Long fixedCtc;
    private Long expectedCtc;
    private Integer noticePeriod;

    // ── Work Experience Summary ──────────────────────────────────────────
    private String experienceCategory;
    private Integer totalExpYears;
    private Integer totalExpMonths;

    // ── Skills ───────────────────────────────────────────────────────────
    private List<String> skills;

    // ── Nested collections (read-only in GET) ────────────────────────────
    private List<ResumeDto> resumes;
    private List<EducationDto> educations;
    private List<CertificationDto> certifications;
    private List<WorkExperienceDto> workExperiences;

    // ── Status ───────────────────────────────────────────────────────────
    private boolean profileCompleted;
}
