package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "counsellor_work_experiences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CounsellorWorkExperience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counsellor_id", nullable = false)
    private Counsellor counsellor;

    private String companyName;
    private String employmentType;
    private String location;
    private String locationType;
    private String fromDate;
    private String toDate;
    private Boolean currentlyWorking;
    private String description;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
