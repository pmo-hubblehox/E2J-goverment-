package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "industry_venues")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IndustryVenue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "industry_partner_id", nullable = false)
    private IndustryPartner industryPartner;

    private String name;
    private String venueType;   // LAB | CLASSROOM | CONFERENCE_ROOM | WORKSHOP
    private Integer capacity;
    private String location;
    private String address;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String amenities;   // comma-separated list

    private boolean active;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); active = true; }
}
