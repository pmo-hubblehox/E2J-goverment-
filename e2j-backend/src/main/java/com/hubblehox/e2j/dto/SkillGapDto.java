package com.hubblehox.e2j.dto;

import lombok.*;

import java.time.LocalDateTime;

public class SkillGapDto {

    @Data
    public static class AnalyzeRequest {
        private String targetRole;
    }

    @Data @Builder
    public static class AnalyzeResponse {
        private String taskId;
        private String message;
    }

    @Data @Builder
    public static class StatusResponse {
        private String status;
        private Integer progress;
        private String message;
    }

    @Data @Builder
    public static class SaveRequest {
        private String targetRole;
        private String curriculum;
        private String resultJson;
    }

    @Data @Builder
    public static class ReportSummary {
        private Long id;
        private String targetRole;
        private String curriculum;
        private LocalDateTime generatedAt;
    }

    @Data @Builder
    public static class ReportDetail {
        private Long id;
        private String targetRole;
        private String curriculum;
        private String reportJson;
        private LocalDateTime generatedAt;
    }
}
