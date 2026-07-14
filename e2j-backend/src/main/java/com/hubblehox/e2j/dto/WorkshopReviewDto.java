package com.hubblehox.e2j.dto;

import lombok.*;

import java.util.Map;

public class WorkshopReviewDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SubmitRequest {
        private Integer trainerRating;
        private Integer venueRating;
        private Integer overallRating;
        private String comment;
        private Map<String, String> answers;
    }

    @Getter @Setter @Builder
    public static class Response {
        private Long id;
        private Long workshopId;
        private String studentName;
        private Integer trainerRating;
        private Integer venueRating;
        private Integer overallRating;
        private String comment;
        private Map<String, String> answers;
        private String createdAt;
    }
}
