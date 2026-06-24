package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.StudentCounsellingDto;
import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.service.StudentCounsellingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/counselling")
@RequiredArgsConstructor
public class StudentCounsellingController {

    private final StudentCounsellingService service;

    @GetMapping("/counsellors")
    public ResponseEntity<ApiResponse<List<StudentCounsellingDto.CounsellorCard>>> listCounsellors() {
        return ResponseEntity.ok(ApiResponse.ok(service.listApprovedCounsellors()));
    }

    @GetMapping("/counsellors/{id}/profile")
    public ResponseEntity<ApiResponse<StudentCounsellingDto.CounsellorProfile>> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getCounsellorProfile(id)));
    }

    @GetMapping("/counsellors/{id}/slots")
    public ResponseEntity<ApiResponse<List<StudentCounsellingDto.SlotDay>>> getSlots(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getAvailableSlots(id)));
    }

    @PostMapping("/counsellors/{id}/book")
    public ResponseEntity<ApiResponse<StudentCounsellingDto.BookingDetail>> book(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody StudentCounsellingDto.BookRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.bookSlot(user, id, req)));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<StudentCounsellingDto.BookingDetail>>> myBookings(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMyBookings(user)));
    }

    @PutMapping("/bookings/{bookingId}/questionnaire")
    public ResponseEntity<ApiResponse<String>> saveQuestionnaire(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> answers) {
        service.saveQuestionnaire(user, bookingId, answers);
        return ResponseEntity.ok(ApiResponse.ok("Questionnaire saved"));
    }
}
