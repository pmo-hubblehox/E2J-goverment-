package com.hubblehox.e2j.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "programs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Program {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false)
    private Institute institute;

    @Column(unique = true)
    private String programId;

    @Column(nullable = false)
    private String degree;

    @Column(nullable = false)
    private String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "program_majors", joinColumns = @JoinColumn(name = "program_id"))
    @Column(name = "major")
    private List<String> majors;

    private int duration;
    private double totalFees;
    private int intakeCapacity;
    private LocalDate deadline;
    private String brochureUrl;
    private String syllabusUrl;
    private String creditStructureUrl;
    private String calendarUrl;

    @Enumerated(EnumType.STRING)
    private Status status = Status.DRAFT;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { DRAFT, UPLOADED }
}
