package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "psychometric_questions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PsychometricQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionText;

    /** R, I, A, S, E, C */
    @Column(nullable = false, length = 1)
    private String category;

    /** TECH, ARTS, COMMERCE, GENERAL */
    @Column(nullable = false)
    private String profileType;

    @Builder.Default
    private boolean active = true;

    private Integer orderIndex;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
