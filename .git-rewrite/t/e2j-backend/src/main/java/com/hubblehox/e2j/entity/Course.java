package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "courses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String instructor;
    private Double rating;
    private Integer studentCount;
    private String duration;
    private Long price; // null = free

    @Enumerated(EnumType.STRING)
    private CourseType type;

    private String category;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "course_skills", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "skill")
    private List<String> skills;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "course_target_roles", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "role")
    private List<String> targetRoles;

    public enum CourseType { INSTITUTE, EXTERNAL }
}
