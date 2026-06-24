package com.hubblehox.e2j.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hubblehox.e2j.config.YouTubeProperties;
import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.repository.StudentProfileRepository;
import com.hubblehox.e2j.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class YouTubeCourseService {

    private final YouTubeProperties props;
    private final StudentRepository studentRepo;
    private final StudentProfileRepository profileRepo;
    private final ObjectMapper objectMapper;

    private static final String YT_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

    // Simple in-memory cache: query → (results, fetchedAt)
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private record CacheEntry(List<Map<String, Object>> results, Instant fetchedAt) {}

    // ── Public API ────────────────────────────────────────────────────────

    public List<Map<String, Object>> getRecommendedVideos(User user) {
        String query = buildQuery(user);
        log.info("Built YouTube query for user {}: {}", user.getEmail(), query);
        return fetchWithCache(query);
    }

    public void clearCache() {
        cache.clear();
    }

    public List<Map<String, Object>> searchVideos(String query) {
        return fetchWithCache(query + " course tutorial");
    }

    // ── Query builder ─────────────────────────────────────────────────────

    private String buildQuery(User user) {
        List<String> terms = new ArrayList<>();

        studentRepo.findByUser(user).ifPresent(student ->
            profileRepo.findByStudent(student).ifPresent(profile -> {
                // Top 3 preferred job roles
                if (profile.getPreferredJobRoles() != null) {
                    profile.getPreferredJobRoles().stream().limit(2).forEach(terms::add);
                }
                // Top 3 skills
                if (profile.getSkills() != null) {
                    profile.getSkills().stream().limit(3).forEach(terms::add);
                }
                // Experience category for context
                if (profile.getExperienceCategory() != null && !profile.getExperienceCategory().isBlank()) {
                    terms.add(profile.getExperienceCategory());
                }
            })
        );

        if (terms.isEmpty()) return "software engineering career course full tutorial";
        return String.join(" ", terms.stream().limit(4).collect(Collectors.toList())) + " course tutorial";
    }

    // ── Fetch + cache ─────────────────────────────────────────────────────

    private List<Map<String, Object>> fetchWithCache(String query) {
        CacheEntry entry = cache.get(query);
        long ttlSeconds = (long) props.getCacheTtlMinutes() * 60;
        if (entry != null && Instant.now().isBefore(entry.fetchedAt().plusSeconds(ttlSeconds))) {
            log.debug("YouTube cache hit for query: {}", query);
            return entry.results();
        }

        List<Map<String, Object>> results = callYouTubeApi(query);
        cache.put(query, new CacheEntry(results, Instant.now()));
        return results;
    }

    // ── YouTube API call ──────────────────────────────────────────────────

    private List<Map<String, Object>> callYouTubeApi(String query) {
        if ("YOUR_KEY_HERE".equals(props.getKey()) || props.getKey() == null || props.getKey().isBlank()) {
            log.warn("YouTube API key not configured — returning empty results");
            return Collections.emptyList();
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(YT_SEARCH_URL)
                    .queryParam("part", "snippet")
                    .queryParam("q", query)
                    .queryParam("type", "video")
                    .queryParam("maxResults", props.getMaxResults())
                    .queryParam("relevanceLanguage", "en")
                    .queryParam("order", "relevance")
                    .queryParam("key", props.getKey())
                    .build().encode().toUriString();

            log.info("YouTube API query: {}", query);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET().build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("YouTube API error {}: {}", response.statusCode(), response.body());
                return Collections.emptyList();
            }

            return parseResponse(response.body());

        } catch (Exception e) {
            log.error("YouTube API call failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    // ── Response parser ───────────────────────────────────────────────────

    private List<Map<String, Object>> parseResponse(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode items = root.path("items");

        List<Map<String, Object>> results = new ArrayList<>();
        for (JsonNode item : items) {
            String videoId = item.path("id").path("videoId").asText(null);
            if (videoId == null) continue;

            JsonNode snippet = item.path("snippet");
            String title       = snippet.path("title").asText("");
            String channel     = snippet.path("channelTitle").asText("");
            String description = snippet.path("description").asText("");
            String publishedAt = snippet.path("publishedAt").asText("");

            JsonNode thumbs = snippet.path("thumbnails");
            String thumbnail = thumbs.has("high")
                    ? thumbs.path("high").path("url").asText("")
                    : thumbs.path("medium").path("url").asText("");

            Map<String, Object> video = new LinkedHashMap<>();
            video.put("id", videoId);
            video.put("title", title);
            video.put("channel", channel);
            video.put("description", description.length() > 200 ? description.substring(0, 200) + "…" : description);
            video.put("thumbnail", thumbnail);
            video.put("publishedAt", publishedAt);
            video.put("url", "https://www.youtube.com/watch?v=" + videoId);
            video.put("embedUrl", "https://www.youtube.com/embed/" + videoId);
            results.add(video);
        }
        return results;
    }
}
