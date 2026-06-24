package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "interview_topic_scores")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewTopicScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    private String topicArea;
    private Integer score; // 0-100
    private Integer questionCount;
}
