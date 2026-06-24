package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/upload")
public class FileUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Universal upload endpoint.
     * POST /upload?userType=industry-partner&entityName=TechNova&docType=PAN
     *
     * Saves to: uploads/{userType}/{entityName}/{docType}/{originalFilename}
     * Serves at: /api/files/{userType}/{entityName}/{docType}/{originalFilename}
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file")       MultipartFile file,
            @RequestParam("userType")   String userType,
            @RequestParam("entityName") String entityName,
            @RequestParam("docType")    String docType) throws IOException {

        String safeUserType   = sanitise(userType);
        String safeEntityName = sanitise(entityName);
        String safeDocType    = sanitise(docType);
        String originalName   = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";

        // uploads/{userType}/{entityName}/{docType}/{originalFilename}
        Path dir = Paths.get(uploadDir, safeUserType, safeEntityName, safeDocType);
        Files.createDirectories(dir);

        Path dest = dir.resolve(originalName);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        String relativePath = safeUserType + "/" + safeEntityName + "/" + safeDocType + "/" + originalName;
        String servedUrl    = "/api/files/" + relativePath;

        log.info("Uploaded: {}", dest.toAbsolutePath());
        return ResponseEntity.ok(ApiResponse.ok(
                Map.of("url", servedUrl, "name", originalName, "path", relativePath),
                "Uploaded"));
    }

    /** Keep the old industry-partner specific path working (backwards compat). */
    @PostMapping("/industry-partner")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadIndustryPartner(
            @RequestParam("file")        MultipartFile file,
            @RequestParam("companyName") String companyName,
            @RequestParam("docType")     String docType) throws IOException {
        return upload(file, "industry-partner", companyName, docType);
    }

    private String sanitise(String s) {
        return s == null ? "unknown"
                : s.trim().replaceAll("[^a-zA-Z0-9 _\\-]", "").replace(" ", "_");
    }
}
