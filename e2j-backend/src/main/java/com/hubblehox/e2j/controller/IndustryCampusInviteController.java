package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.IndustryCampusInviteDto;
import com.hubblehox.e2j.service.IndustryCampusInviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class IndustryCampusInviteController {

    private final IndustryCampusInviteService service;

    // ── Industry Portal endpoints ─────────────────────────────────────────────

    @GetMapping("/industry-portal/campus/institutes")
    public ResponseEntity<ApiResponse<List<IndustryCampusInviteDto.InstituteItem>>> getInstitutes() {
        return ResponseEntity.ok(ApiResponse.ok(service.listApprovedInstitutes()));
    }

    @PostMapping("/industry-portal/campus")
    public ResponseEntity<ApiResponse<IndustryCampusInviteDto.Response>> create(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody IndustryCampusInviteDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.create(ud.getUsername(), req), "Invite sent"));
    }

    @GetMapping("/industry-portal/campus")
    public ResponseEntity<ApiResponse<List<IndustryCampusInviteDto.Response>>> list(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(ud.getUsername(), status), "OK"));
    }

    @PatchMapping("/industry-portal/campus/{id}/status")
    public ResponseEntity<ApiResponse<IndustryCampusInviteDto.Response>> updateStatus(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateStatus(ud.getUsername(), id, body.get("status")), "Updated"));
    }

    @DeleteMapping("/industry-portal/campus/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        service.delete(ud.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }
}
