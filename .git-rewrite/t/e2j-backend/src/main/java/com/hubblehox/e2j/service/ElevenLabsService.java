package com.hubblehox.e2j.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ElevenLabsService {

    @Value("${elevenlabs.api.key}")
    private String apiKey;

    @Value("${elevenlabs.voices.english}")
    private String englishVoiceId;

    @Value("${elevenlabs.voices.hindi}")
    private String hindiVoiceId;

    private static final String TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/";
    private static final String MODEL = "eleven_multilingual_v2";

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public byte[] textToSpeech(String text, String language) {
        String voiceId = "Hindi".equalsIgnoreCase(language) ? hindiVoiceId : englishVoiceId;

        Map<String, Object> voiceSettings = new LinkedHashMap<>();
        voiceSettings.put("stability", 0.5);
        voiceSettings.put("similarity_boost", 0.75);
        voiceSettings.put("style", 0.2);
        voiceSettings.put("use_speaker_boost", true);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("text", text);
        body.put("model_id", MODEL);
        body.put("voice_settings", voiceSettings);

        try {
            String json = mapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TTS_URL + voiceId + "?output_format=mp3_44100_128"))
                    .header("xi-api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "audio/mpeg")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() != 200)
                throw new RuntimeException("ElevenLabs TTS error: " + response.statusCode());

            return response.body();
        } catch (Exception e) {
            throw new RuntimeException("TTS failed: " + e.getMessage(), e);
        }
    }
}
