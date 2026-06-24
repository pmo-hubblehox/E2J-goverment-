package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.IndustrySmeDto;
import com.hubblehox.e2j.service.IndustrySmeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/industry-portal/sme")
@RequiredArgsConstructor
public class IndustrySmeController {

    private final IndustrySmeService service;

    @PostMapping
    public ResponseEntity<ApiResponse<IndustrySmeDto.Response>> create(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody IndustrySmeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.create(ud.getUsername(), req), "Created"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<IndustrySmeDto.Response>>> list(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(ud.getUsername()), "OK"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IndustrySmeDto.Response>> get(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.get(ud.getUsername(), id), "OK"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IndustrySmeDto.Response>> update(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestBody IndustrySmeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(ud.getUsername(), id, req), "Updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        service.delete(ud.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }
}
