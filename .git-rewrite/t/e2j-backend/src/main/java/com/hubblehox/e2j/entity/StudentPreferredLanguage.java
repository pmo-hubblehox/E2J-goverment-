package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_preferred_languages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentPreferredLanguage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String language;

    @Builder.Default private boolean canRead   = false;
    @Builder.Default private boolean canWrite  = false;
    @Builder.Default private boolean canSpeak  = false;
    @Builder.Default private boolean isNative  = false;
}
