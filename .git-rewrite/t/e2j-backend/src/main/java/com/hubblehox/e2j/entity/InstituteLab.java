package com.hubblehox.e2j.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "institute_labs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InstituteLab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false)
    private Institute institute;

    // Preliminary
    private String labName;
    private String buildingName;
    private String floor;

    // Images
    private String labImg;
    private String labCorridorImg;
    private String labEntranceImg;
    private String labPhotoFrontLeft;
    private String labPhotoFrontRight;

    // Facilities
    private Boolean acAvailable;
    private Boolean fansAvailable;
    private Boolean noiseFree;
    private Boolean partition;
    private Boolean lighting;
    private Boolean printer;

    // CCTV
    private Boolean cctvAvailable;
    private Integer cctvCount;
    private Integer cctvNodes;
    private Integer cctvDays;
    private Boolean cctvHighQuality;
    private Boolean blindSpots;
    private String blindSpotImg;

    // Network
    private String networkType;
    private String lanSingleMultiple;
    private String lanType;
    private String networkTopology;
    private Integer networkSpeed;

    // Computers
    private Integer numComputers;
    private Integer numBuffers;
    private String computerCompany;
    private String ramCapacity;
    private String operatingSystem;
    private String browserName;
    private String browserVersion;
    private String computerPartitionsImg;
    private String computerNumberingImg;
    private String computerMonitorImg;
    private String deskImg;
    private String cpuImg;
    private String upsImg;

    private Double pricing;
    private String pricingUnit;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
