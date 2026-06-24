package com.hubblehox.e2j.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResumeDto {
    private Long id;
    private String fileName;
    private String fileUrl;
    private boolean isPrimary;
    private String uploadedAt;
}
