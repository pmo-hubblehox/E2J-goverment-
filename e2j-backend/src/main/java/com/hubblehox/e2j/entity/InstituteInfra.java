package com.hubblehox.e2j.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "institute_infra")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InstituteInfra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false, unique = true)
    private Institute institute;

    // Basic Details
    private String buildingEntranceImg;
    private Integer numFloors;
    private String landArea;
    private String builtUpArea;
    private String landOwnerName;
    private Boolean separateGates;
    private String entryGateImg;
    private String exitGateImg;
    private String registrationDeskImg;
    private String receptionAreaImg;
    private Boolean parking;
    private Boolean pwd;
    private String pwdImg;
    private Integer liftCount;
    private String liftImg;
    private Boolean washroomsAvailable;
    private Boolean washroomsPerFloor;
    private String washroomsImg;
    private Boolean separateWashrooms;
    private String maleWashroomImg;
    private String femaleWashroomImg;
    private Boolean cctvAvailable;
    private String cctvImg;
    private Boolean drinkingWater;
    private String drinkingWaterImg;
    private Boolean acAvailable;
    private String acImg;

    // Safety
    private Boolean firstAidKit;
    private String firstAidKitImg;
    private Boolean fireExtPerFloor;
    private Boolean fireExtAccessible;
    private String fireExtImg;
    private Boolean assemblyArea;
    private Boolean safetySigns;
    private Boolean insurance;

    // Power Backup
    private Boolean powerGenset;
    private String gensetType;
    private String dgCapacity;
    private Boolean upsAvailable;
}
