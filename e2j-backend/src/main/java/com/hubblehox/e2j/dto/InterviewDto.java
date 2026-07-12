package com.hubblehox.e2j.dto;

import lombok.*;

import java.util.List;

public class InterviewDto {

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SessionResponse {
        private Long sessionId;
        private Long questionId;
        private String questionText;
        private String topicArea;
        private Integer questionNumber;
        private Boolean isComplete;
        private String targetRole;
        private String language;
        private Integer scoreForPreviousAnswer;
        private String feedbackForPreviousAnswer;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SessionSummary {
        private Long id;
        private String targetRole;
        private String status;
        private Integer overallScore;
        private String readinessBand;
        private Integer durationMinutes;
        private Integer questionCount;
        private String createdAt;
        private String language;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReportResponse {
        private Long sessionId;
        private String targetRole;
        private String experienceLevel;
        private String status;
        private Integer overallScore;
        private String readinessBand;
        private String reportSummary;
        private List<String> strengths;
        private List<String> improvements;
        private Integer durationMinutes;
        private List<TopicScore> topicScores;
        private List<QuestionDetail> questions;
        private String createdAt;
        private Integer violationCount;
        private boolean endedEarly;
        private Integer mcqScore;
        private Integer difficultyLevel;
        private List<McqReviewItem> mcqReview;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class QuestionDetail {
        private Long id;
        private Integer sequenceNumber;
        private String topicArea;
        private String questionText;
        private String studentAnswer;
        private Integer aiScore;
        private String aiFeedback;
        private Boolean isFollowUp;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopicScore {
        private String topicArea;
        private Integer score;
        private Integer questionCount;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AnswerRequest {
        private Long questionId;
        private String transcript;
        private Integer violationCount;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class StartRequest {
        private String selectedRole;   // chosen from student's saved aspirations
        private String language;       // "English", "Hindi", "Tamil", etc.
        private Integer difficultyLevel; // 1-10, from pre-interview MCQ round; null = medium (5)
        private Integer mcqScore;      // 0-10, from pre-interview MCQ round
        private List<McqReviewItem> mcqReview; // per-question review, persisted for the report
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class McqGenerateRequest {
        private String role;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class McqQuestion {
        private String questionText;
        private List<String> options;
        private Integer correctIndex; // never sent to client on /generate — stripped before response
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class McqReviewItem {
        private String questionText;
        private List<String> options;
        private Integer selectedIndex;
        private Integer correctIndex;
        private boolean correct;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class McqGenerateResponse {
        private String quizId;
        private List<McqQuestion> questions;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class McqEvaluateRequest {
        private String quizId;
        private List<Integer> selectedAnswers;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class McqEvaluateResponse {
        private Integer score;
        private Integer difficultyLevel;
        private List<McqReviewItem> review;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SuggestionRequest {
        private String questionText;
        private String studentAnswer;
        private String targetRole;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SuggestionResponse {
        private String idealAnswer;
        private String keyPoints;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AspirationOption {
        private List<String> roles;
        private List<String> skills;
        private String experienceLevel;
    }
}
