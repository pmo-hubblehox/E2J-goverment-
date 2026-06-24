package com.hubblehox.e2j.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EducationDto {
    private Long id;
    private String degree;
    private String schoolUniversity;
    private String majorSpecialization;
    private String yearOfPassing;
    private String percentageCgpa;
    private boolean locked;
}
