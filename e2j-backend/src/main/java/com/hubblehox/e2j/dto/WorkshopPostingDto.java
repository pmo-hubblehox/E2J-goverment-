package com.hubblehox.e2j.dto;

import lombok.*;

import java.util.List;

public class WorkshopPostingDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {
        private Long industrySmeId;
        private Long facultyId;
        private String title;
        private String description;
        private List<String> targetRoles;
        private String mode; // ONLINE | IN_PERSON
        private String sessionDate;
        private String sessionEndDate;
        private String sessionTime;
        private String city;
        private String state;
        private String venueAddress;
        private String venueMapUrl;
        private Double feeAmount;
        private Integer totalSeats;
        private String prerequisite;
        private String customQuestion;
    }

    @Getter @Setter @Builder
    public static class Response {
        private Long id;
        private String posterName;
        private String trainerName;
        private String title;
        private String description;
        private List<String> targetRoles;
        private String mode;
        private String sessionDate;
        private String sessionEndDate;
        private String sessionTime;
        private Integer durationMinutes;
        private String city;
        private String state;
        private String venueAddress;
        private String venueMapUrl;
        private String meetingLink;
        private Double feeAmount;
        private Integer totalSeats;
        private Integer seatsConfirmed;
        private String status;
        private String rejectionReason;
        private Double rating;
        private String createdAt;
        private String prerequisite;
        private String customQuestion;
        private Long industrySmeId;
        private Long facultyId;
    }
}
