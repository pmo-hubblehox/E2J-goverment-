package com.hubblehox.e2j.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "institute_rooms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InstituteRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false)
    private Institute institute;

    private String roomType;
    private Integer roomCount;
    private String area;
    private Integer personCapacity;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "institute_room_equipment", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "equipment")
    private List<String> equipment;

    private String notes;
    private Double pricing;
    private String pricingUnit;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
