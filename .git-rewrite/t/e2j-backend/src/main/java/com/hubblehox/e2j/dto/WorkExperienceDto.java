package com.hubblehox.e2j.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkExperienceDto {
    private Long id;
    private String companyName;
    private String employmentType;
    private String location;
    private String locationType;
    private String fromDate;
    private String toDate;
}
