package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "workshop_reviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkshopReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true)
    private WorkshopEnrollment enrollment;

    private Integer trainerRating;
    private Integer venueRating;
    private Integer overallRating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    /** Answers to the fixed feedback questions: {"trainerClarity":"Agree","trainerEngagement":"Strongly Agree","venueComfort":"Neutral","wouldRecommend":"Agree"} */
    @Column(columnDefinition = "TEXT")
    private String answersJson;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
