package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.JobPostingDto;
import com.hubblehox.e2j.service.JobPostingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/industry-portal/jobs")
@RequiredArgsConstructor
public class JobPostingController {

    private final JobPostingService service;

    @PostMapping
    public ResponseEntity<ApiResponse<JobPostingDto.Response>> create(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody JobPostingDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.create(ud.getUsername(), req), "Created"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobPostingDto.Response>>> list(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(ud.getUsername(), type), "OK"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobPostingDto.Response>> get(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.get(ud.getUsername(), id), "OK"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobPostingDto.Response>> update(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestBody JobPostingDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(ud.getUsername(), id, req), "Updated"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<JobPostingDto.Response>> updateStatus(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateStatus(ud.getUsername(), id, body.get("status")), "Updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        service.delete(ud.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }
}
