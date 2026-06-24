package com.hubblehox.e2j.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class StudentCounsellingDto {

    @Data @Builder
    public static class CounsellorCard {
        private Long id;
        private String name;
        private String email;
        private String photoUrl;
        private String specialty;
        private Integer experienceYears;
        private Integer experienceMonths;
        private List<String> skills;
        private List<String> languages;
        private Double feeAmount;
        private String feeType;
        private Double rating;
    }

    @Data @Builder
    public static class SlotDay {
        private String date;       // "2026-06-25"
        private String dayLabel;   // "WED 25 JUN"
        private List<String> times; // ["10:00 AM", "02:00 PM"]
    }

    @Data @Builder
    public static class EducationItem {
        private String degree;
        private String schoolName;
        private String major;
        private String yearOfPassing;
    }

    @Data @Builder
    public static class WorkItem {
        private String companyName;
        private String employmentType;
        private String fromDate;
        private String toDate;
        private Boolean currentlyWorking;
        private String description;
    }

    @Data @Builder
    public static class CertItem {
        private String certificateName;
        private String awardingInstitute;
        private String validTill;
    }

    @Data @Builder
    public static class CounsellorProfile {
        private Long id;
        private String name;
        private String email;
        private String photoUrl;
        private String specialty;
        private Integer experienceYears;
        private Integer experienceMonths;
        private List<String> skills;
        private Double feeAmount;
        private String feeType;
        private String linkedinUrl;
        private String city;
        private String state;
        private List<EducationItem> education;
        private List<WorkItem> workExperience;
        private List<CertItem> certifications;
    }

    @Data @Builder
    public static class BookRequest {
        private String sessionDate;
        private String sessionTime;
        private Double feeAmount;
    }

    @Data @Builder
    public static class BookingDetail {
        private Long id;
        private Long counsellorId;
        private String counsellorName;
        private String counsellorPhoto;
        private String specialty;
        private String sessionDate;
        private String sessionTime;
        private Double feeAmount;
        private String status;
        private String meetLink;
        private LocalDateTime createdAt;
    }
}
