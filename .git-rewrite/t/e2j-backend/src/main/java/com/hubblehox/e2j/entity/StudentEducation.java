package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_education")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentEducation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String degree;

    @Column(nullable = false)
    private String schoolUniversity;

    private String majorSpecialization;
    private String yearOfPassing;
    private String percentageCgpa;

    @Builder.Default
    @Column(nullable = false)
    private boolean locked = false; // true = set by institute, student cannot edit/delete

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
