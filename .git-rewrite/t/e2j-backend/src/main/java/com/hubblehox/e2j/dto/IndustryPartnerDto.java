package com.hubblehox.e2j.dto;

import com.hubblehox.e2j.entity.IndustryPartner;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class IndustryPartnerDto {

    @Data @Builder
    public static class SpocDetailDto {
        private String contactType;
        private String contactPersonName;
        private String emailAddress;
        private String contactNumber;
    }

    @Data
    @Builder
    public static class ApplicationRequest {
        // Company Information
        private String registeredName;
        private String registeringAs;
        private String industrySector;
        private String organizationSize;
        private String websiteUrl;
        private String onlinePaymentLink;

        // Address
        private String houseNumber;
        private String flatFloor;
        private String country;
        private String pinCode;
        private String state;
        private String district;
        private String city;
        private String taluka;
        private String areaLocality;
        private String landmark;

        // Business Details
        private String pan;
        private String taxId;
        private Integer numberOfEmployees;
        private String annualRevenue;
        private String jobRolesAvailable;
        private List<String> employeeBenefits;
        private String recruitmentVision;
        private String trainingSectors;
        private List<String> trainingMethods;
        private String trainingVision;
        private List<SpocDetailDto> spocDetails;

        // Documents
        private String panDocUrl;
        private String gstDocUrl;
        private String tanDocUrl;
        private String cinDocUrl;
        private String brochureUrl;
    }

    @Data
    @Builder
    public static class ApplicationResponse {
        private Long id;

        // Company Information
        private String registeredName;
        private String registeringAs;
        private String industrySector;
        private String organizationSize;
        private String websiteUrl;
        private String onlinePaymentLink;

        // Address
        private String houseNumber;
        private String flatFloor;
        private String country;
        private String pinCode;
        private String state;
        private String district;
        private String city;
        private String taluka;
        private String areaLocality;
        private String landmark;

        // Business Details
        private String pan;
        private String taxId;
        private Integer numberOfEmployees;
        private String annualRevenue;
        private String jobRolesAvailable;
        private List<String> employeeBenefits;
        private String recruitmentVision;
        private String trainingSectors;
        private List<String> trainingMethods;
        private String trainingVision;
        private List<SpocDetailDto> spocDetails;

        // Documents
        private String panDocUrl;
        private String gstDocUrl;
        private String tanDocUrl;
        private String cinDocUrl;
        private String brochureUrl;

        // Status
        private String applicationStatus;
        private LocalDateTime submittedAt;
        private String rejectionReason;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    public static class StatusResponse {
        private String applicationStatus;
        private LocalDateTime submittedAt;
        private String rejectionReason;
    }

    public static ApplicationResponse toResponse(IndustryPartner p) {
        return ApplicationResponse.builder()
                .id(p.getId())
                .registeredName(p.getRegisteredName())
                .registeringAs(p.getRegisteringAs())
                .industrySector(p.getIndustrySector())
                .organizationSize(p.getOrganizationSize())
                .websiteUrl(p.getWebsiteUrl())
                .onlinePaymentLink(p.getOnlinePaymentLink())
                .houseNumber(p.getHouseNumber())
                .flatFloor(p.getFlatFloor())
                .country(p.getCountry())
                .pinCode(p.getPinCode())
                .state(p.getState())
                .district(p.getDistrict())
                .city(p.getCity())
                .taluka(p.getTaluka())
                .areaLocality(p.getAreaLocality())
                .landmark(p.getLandmark())
                .pan(p.getPan())
                .taxId(p.getTaxId())
                .numberOfEmployees(p.getNumberOfEmployees())
                .annualRevenue(p.getAnnualRevenue())
                .jobRolesAvailable(p.getJobRolesAvailable())
                .employeeBenefits(p.getEmployeeBenefits())
                .recruitmentVision(p.getRecruitmentVision())
                .trainingSectors(p.getTrainingSectors())
                .trainingMethods(p.getTrainingMethods())
                .trainingVision(p.getTrainingVision())
                .spocDetails(p.getSpocDetails() == null ? List.of() : p.getSpocDetails().stream()
                        .map(s -> SpocDetailDto.builder()
                                .contactType(s.getContactType())
                                .contactPersonName(s.getContactPersonName())
                                .emailAddress(s.getEmailAddress())
                                .contactNumber(s.getContactNumber())
                                .build())
                        .toList())
                .panDocUrl(p.getPanDocUrl())
                .gstDocUrl(p.getGstDocUrl())
                .tanDocUrl(p.getTanDocUrl())
                .cinDocUrl(p.getCinDocUrl())
                .brochureUrl(p.getBrochureUrl())
                .applicationStatus(p.getApplicationStatus().name())
                .submittedAt(p.getSubmittedAt())
                .rejectionReason(p.getRejectionReason())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
