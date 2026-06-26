package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.IndustrySmeDto;
import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.IndustryPartnerRepository;
import com.hubblehox.e2j.service.ExcelService;
import com.hubblehox.e2j.service.IndustrySmeService;
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
@RequestMapping("/industry-portal/sme")
@RequiredArgsConstructor
public class IndustrySmeController {

    private final IndustrySmeService service;
    private final ExcelService excelService;
    private final IndustryPartnerRepository partnerRepo;

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

    // ── Bulk upload ───────────────────────────────────────────────────────────

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkUpload(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam("file") MultipartFile file) throws Exception {
        IndustryPartner partner = partnerRepo.findByUser_Email(ud.getUsername())
                .orElseThrow(() -> new AppException("Partner not found", HttpStatus.NOT_FOUND));
        int count = excelService.bulkUploadSmes(file, partner);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("created", count), count + " SME(s) uploaded"));
    }

    @GetMapping("/bulk/sample")
    public ResponseEntity<byte[]> sampleExcel() throws Exception {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header("Content-Disposition", "attachment; filename=sample_smes.xlsx")
                .body(excelService.sampleSmesExcel());
    }
}
