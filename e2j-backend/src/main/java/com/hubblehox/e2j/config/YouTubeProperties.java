package com.hubblehox.e2j.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "youtube.api")
@Getter @Setter
public class YouTubeProperties {
    private String key;
    private int maxResults = 12;
    private int cacheTtlMinutes = 60;
}
