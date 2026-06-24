package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_bookings",
    uniqueConstraints = @UniqueConstraint(columnNames = {"counsellor_id", "session_date", "session_time"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counsellor_id", nullable = false)
    private Counsellor counsellor;

    @Column(name = "session_date", nullable = false)
    private String sessionDate;

    @Column(name = "session_time", nullable = false)
    private String sessionTime;

    private Double feeAmount;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.CONFIRMED;

    private String meetLink;
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String q1Interests;
    @Column(columnDefinition = "TEXT")
    private String q2CareerGoal;
    @Column(columnDefinition = "TEXT")
    private String q3Industry;
    @Column(columnDefinition = "TEXT")
    private String q4Skills;
    @Column(columnDefinition = "TEXT")
    private String q5Challenges;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { CONFIRMED, COMPLETED, CANCELLED }
}
