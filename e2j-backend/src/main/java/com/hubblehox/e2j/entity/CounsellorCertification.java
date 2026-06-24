package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "counsellor_certifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CounsellorCertification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counsellor_id", nullable = false)
    private Counsellor counsellor;

    private String certificateId;
    private String certificateName;
    private String awardingInstitute;
    private String validTill;
    private String documentUrl;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
