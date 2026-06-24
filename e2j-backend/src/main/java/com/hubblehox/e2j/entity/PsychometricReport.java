package com.hubblehox.e2j.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "psychometric_reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PsychometricReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    /** Optional link to the aspiration created after the test */
    private Long aspirationId;

    /** JSON: {"R":18,"I":23,"A":11,"S":14,"E":19,"C":9} */
    @Column(columnDefinition = "TEXT")
    private String scoresJson;

    /** JSON array: ["Data Scientist","AI/ML Engineer",...] */
    @Column(columnDefinition = "TEXT")
    private String recommendedPathsJson;

    /** Top 2 categories e.g. "Investigative, Enterprising" */
    private String topInterests;

    /** Highest recommended role */
    private String topCareerMatch;

    /** Total score out of 150 */
    private Integer totalScore;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
