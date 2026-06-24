package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.InterviewDto;
import com.hubblehox.e2j.service.ElevenLabsService;
import com.hubblehox.e2j.service.InterviewService;
import com.hubblehox.e2j.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/student/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;
    private final ElevenLabsService elevenLabsService;

    /** Proxy TTS — API key stays server-side, never exposed to browser */
    @PostMapping("/tts")
    public ResponseEntity<byte[]> tts(@RequestBody TtsRequest request) {
        byte[] audio = elevenLabsService.textToSpeech(request.getText(), request.getLanguage());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .body(audio);
    }

    /** Fetch student's saved aspirations for pre-interview setup */
    @GetMapping("/aspirations")
    public ResponseEntity<ApiResponse<InterviewDto.AspirationOption>> aspirations(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(interviewService.getAspirationOptions(userDetails.getUsername())));
    }

    /** Start a new interview session */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<InterviewDto.SessionResponse>> start(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) InterviewDto.StartRequest request) {
        InterviewDto.SessionResponse res = interviewService.startSession(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    /** Submit an answer and get the next question */
    @PostMapping("/{sessionId}/answer")
    public ResponseEntity<ApiResponse<InterviewDto.SessionResponse>> answer(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @RequestBody InterviewDto.AnswerRequest request) {
        InterviewDto.SessionResponse res = interviewService.submitAnswer(
                userDetails.getUsername(), sessionId, request.getQuestionId(),
                request.getTranscript(), request.getViolationCount());
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    /** List all past sessions for this student */
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<InterviewDto.SessionSummary>>> sessions(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<InterviewDto.SessionSummary> list = interviewService.getSessions(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /** Get ideal answer suggestion for a question (on-demand, for report page) */
    @PostMapping("/question-suggestion")
    public ResponseEntity<ApiResponse<InterviewDto.SuggestionResponse>> suggestion(
            @RequestBody InterviewDto.SuggestionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(interviewService.getIdealAnswer(request)));
    }

    /** Mark a session as ABANDONED */
    @PostMapping("/{sessionId}/abandon")
    public ResponseEntity<ApiResponse<Void>> abandon(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        interviewService.abandonSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /** Resume an in-progress session — returns the last unanswered question */
    @GetMapping("/{sessionId}/resume")
    public ResponseEntity<ApiResponse<InterviewDto.SessionResponse>> resume(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        InterviewDto.SessionResponse res = interviewService.resumeSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    /** Regenerate AI report for a completed session */
    @PostMapping("/{sessionId}/regenerate-report")
    public ResponseEntity<ApiResponse<InterviewDto.ReportResponse>> regenerateReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        InterviewDto.ReportResponse res = interviewService.regenerateReport(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    /** Get full report for a completed session */
    @GetMapping("/{sessionId}/report")
    public ResponseEntity<ApiResponse<InterviewDto.ReportResponse>> report(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        InterviewDto.ReportResponse res = interviewService.getReport(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    public static class TtsRequest {
        private String text;
        private String language;

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
    }
}
