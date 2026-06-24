package com.hubblehox.e2j.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PreferredLanguageDto {
    private Long id;
    private String language;
    private boolean canRead;
    private boolean canWrite;
    private boolean canSpeak;
    private boolean isNative;
}
