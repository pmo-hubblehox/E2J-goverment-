package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "counsellor_educations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CounsellorEducation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counsellor_id", nullable = false)
    private Counsellor counsellor;

    private String degree;
    private String schoolName;
    private String major;
    private String designation;
    private String yearOfPassing;
    private Boolean currentlyPursuing;
    private String percentageType;
    private Double percentageValue;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
