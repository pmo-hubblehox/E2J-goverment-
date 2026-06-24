package com.hubblehox.e2j.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "student_aspirations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentAspiration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    private String goal;

    @Column(nullable = false)
    private String roleArea;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "aspiration_skills", joinColumns = @JoinColumn(name = "aspiration_id"))
    @Column(name = "skill")
    private List<String> skills;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
