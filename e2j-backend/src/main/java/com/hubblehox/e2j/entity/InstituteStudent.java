package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "institute_students", uniqueConstraints = {
    @UniqueConstraint(name = "uq_institute_student_id", columnNames = {"institute_id", "student_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InstituteStudent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false)
    private Institute institute;

    private String studentId;
    private String name;
    private String email;
    private String phone;
    private String degree;
    private String schoolUniversity;
    private String major;
    private String yearOfPassing;
    private Double cgpa;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { ACTIVE, INACTIVE, GRADUATED }
}
