package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "faculty")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Faculty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false)
    private Institute institute;

    @Column(nullable = false)
    private String name;

    @ElementCollection
    @CollectionTable(name = "faculty_expertise", joinColumns = @JoinColumn(name = "faculty_id"))
    @Column(name = "expertise")
    private List<String> expertise;

    @ElementCollection
    @CollectionTable(name = "faculty_days", joinColumns = @JoinColumn(name = "faculty_id"))
    @Column(name = "day")
    private List<String> days;

    private String mode;
    private String bio;
    private Double rating;
    private Integer studentsCounselled;

    @Enumerated(EnumType.STRING)
    private Status status = Status.AVAILABLE;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { AVAILABLE, UNAVAILABLE }
}
