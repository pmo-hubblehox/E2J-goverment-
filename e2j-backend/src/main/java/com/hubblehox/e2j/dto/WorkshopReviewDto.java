package com.hubblehox.e2j.dto;

import lombok.*;

public class WorkshopReviewDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SubmitRequest {
        private Integer trainerRating;
        private Integer venueRating;
        private Integer overallRating;
        private String comment;
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
        private String createdAt;
    }
}
