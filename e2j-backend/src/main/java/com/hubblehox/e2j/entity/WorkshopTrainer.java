package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workshop_trainers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkshopTrainer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "industry_partner_id")
    private IndustryPartner industryPartner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id")
    private Institute institute;

    private Long industrySmeId;
    private Long facultyId;

    private String name;
    private String email;
    private String phone;

    @ElementCollection
    @Builder.Default
    private List<String> expertiseAreas = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { ACTIVE, INACTIVE }
}
