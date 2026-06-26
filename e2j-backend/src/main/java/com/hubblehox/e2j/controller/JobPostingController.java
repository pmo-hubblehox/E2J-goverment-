package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.JobPostingDto;
import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.IndustrySme;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.IndustryPartnerRepository;
import com.hubblehox.e2j.repository.IndustrySmeRepository;
import com.hubblehox.e2j.service.ExcelService;
import com.hubblehox.e2j.service.JobPostingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/industry-portal/jobs")
@RequiredArgsConstructor
public class JobPostingController {

    private final JobPostingService service;
    private final ExcelService excelService;
    private final IndustryPartnerRepository partnerRepo;

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

    // ── Bulk upload ───────────────────────────────────────────────────────────

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkUpload(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam("file") MultipartFile file) throws Exception {
        IndustryPartner partner = partnerRepo.findByUser_Email(ud.getUsername())
                .orElseThrow(() -> new AppException("Partner not found", HttpStatus.NOT_FOUND));
        int count = excelService.bulkUploadJobs(file, partner);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("created", count), count + " job(s) uploaded"));
    }

    @GetMapping("/bulk/sample")
    public ResponseEntity<byte[]> sampleExcel() throws Exception {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header("Content-Disposition", "attachment; filename=sample_jobs.xlsx")
                .body(excelService.sampleJobsExcel());
    }
}
