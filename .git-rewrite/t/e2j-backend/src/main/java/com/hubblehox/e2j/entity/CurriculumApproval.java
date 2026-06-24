package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "curriculum_approvals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CurriculumApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id", nullable = false)
    private Curriculum curriculum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bos_member_id", nullable = false)
    private BosMember bosMember;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bos_user_id")
    private User bosUser;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Decision decision = Decision.PENDING;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    private LocalDateTime decidedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Decision { PENDING, APPROVED, REJECTED }
}
