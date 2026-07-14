package com.hubblehox.e2j.dto;

import lombok.*;

import java.util.List;

public class WorkshopEnrollmentDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class EnrollRequest {
        private String formAnswer;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class BulkEnrollRequest {
        private List<Long> instituteStudentIds;
    }

    @Getter @Setter @Builder
    public static class Response {
        private Long id;
        private Long workshopId;
        private String workshopTitle;
        private String mode;
        private String sessionDate;
        private String sessionEndDate;
        private String sessionTime;
        private String meetingLink;
        private String venueAddress;
        private String venueMapUrl;
        private String status;
        private Integer waitlistPosition;
        private Double feeAmount;
        private String createdAt;
    }

    @Getter @Setter @Builder
    public static class BulkEnrollResult {
        private int totalRequested;
        private int confirmed;
        private int waitlisted;
        private int skipped;
    }

    @Getter @Setter @Builder
    public static class RosterRow {
        private Long id;
        private String studentName;
        private String studentEmail;
        private String status;
        private Integer waitlistPosition;
        private String formAnswer;
        private String enrolledVia;
        private String createdAt;
    }
}
