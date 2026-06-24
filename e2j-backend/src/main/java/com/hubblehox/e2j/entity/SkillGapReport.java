package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "skill_gap_reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SkillGapReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String targetRole;

    private String curriculum;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reportJson;

    @Column(updatable = false)
    private LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() { generatedAt = LocalDateTime.now(); }
}
