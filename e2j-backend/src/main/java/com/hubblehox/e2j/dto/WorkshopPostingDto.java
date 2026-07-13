package com.hubblehox.e2j.dto;

import lombok.*;

public class WorkshopPostingDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {
        private Long industrySmeId;
        private Long facultyId;
        private String title;
        private String description;
        private String targetRole;
        private String mode; // ONLINE | IN_PERSON
        private String sessionDate;
        private String sessionTime;
        private Integer durationMinutes;
        private String city;
        private String state;
        private String venueAddress;
        private Double feeAmount;
        private Integer totalSeats;
        private String customQuestion;
    }

    @Getter @Setter @Builder
    public static class Response {
        private Long id;
        private String posterName;
        private String trainerName;
        private String title;
        private String description;
        private String targetRole;
        private String mode;
        private String sessionDate;
        private String sessionTime;
        private Integer durationMinutes;
        private String city;
        private String state;
        private String venueAddress;
        private String meetingLink;
        private Double feeAmount;
        private Integer totalSeats;
        private Integer seatsConfirmed;
        private String status;
        private String rejectionReason;
        private Double rating;
        private String createdAt;
        private String customQuestion;
        private Long industrySmeId;
        private Long facultyId;
    }
}
