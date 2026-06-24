package com.hubblehox.e2j.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificationDto {
    private Long id;
    private String certificationId;
    private String certificationName;
    private String awardingInstitute;
    private String validTill;
    private String fileUrl;
}
