package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/counsellor")
@RequiredArgsConstructor
public class CounsellorController {

    private final CounsellorRepository              counsellorRepo;
    private final CounsellorEducationRepository     educationRepo;
    private final CounsellorWorkExperienceRepository workExpRepo;
    private final CounsellorCertificationRepository  certRepo;
    private final CounsellorSessionRepository       sessionRepo;
    private final StudentBookingRepository          bookingRepo;
    private final PsychometricReportRepository      psychometricReportRepo;
    private final com.hubblehox.e2j.service.PsychometricService psychometricService;
    private final JavaMailSender mailSender;

    private Counsellor get(User user) {
        return counsellorRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Counsellor profile not found", HttpStatus.NOT_FOUND));
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Counsellor>> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(get(user)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Counsellor>> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        Counsellor c = get(user);
        boolean completing = Boolean.TRUE.equals(body.get("onboardingCompleted"));
        body.remove("name"); // name is always immutable

        if (c.getStatus() == Counsellor.Status.APPROVED) {
            // Approved counsellor — accumulate ALL changes in pendingData, never touch live record
            body.remove("onboardingCompleted");
            try {
                // Merge into any existing pending draft
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> draft = c.getPendingData() != null
                    ? mapper.readValue(c.getPendingData(), new com.fasterxml.jackson.core.type.TypeReference<>() {})
                    : new LinkedHashMap<>();
                draft.putAll(body);
                c.setPendingData(mapper.writeValueAsString(draft));
            } catch (Exception e) {
                throw new AppException("Failed to store pending data", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            if (completing) c.setPendingProfileUpdate(true);
            return ResponseEntity.ok(ApiResponse.ok(counsellorRepo.save(c)));
        }

        // Not yet approved — apply changes immediately
        if (body.containsKey("phone"))              c.setPhone((String) body.get("phone"));
        if (body.containsKey("photoUrl"))           c.setPhotoUrl((String) body.get("photoUrl"));
        if (body.containsKey("aadhaarUrl"))         c.setAadhaarUrl((String) body.get("aadhaarUrl"));
        if (body.containsKey("gender"))             c.setGender((String) body.get("gender"));
        if (body.containsKey("differentlyAbled"))   c.setDifferentlyAbled((String) body.get("differentlyAbled"));
        if (body.containsKey("remarks"))            c.setRemarks((String) body.get("remarks"));
        if (body.containsKey("houseNumber"))        c.setHouseNumber((String) body.get("houseNumber"));
        if (body.containsKey("flatNumber"))         c.setFlatNumber((String) body.get("flatNumber"));
        if (body.containsKey("country"))            c.setCountry((String) body.get("country"));
        if (body.containsKey("pincode"))            c.setPincode((String) body.get("pincode"));
        if (body.containsKey("state"))              c.setState((String) body.get("state"));
        if (body.containsKey("city"))               c.setCity((String) body.get("city"));
        if (body.containsKey("area"))               c.setArea((String) body.get("area"));
        if (body.containsKey("landmark"))           c.setLandmark((String) body.get("landmark"));
        if (body.containsKey("linkedinUrl"))        c.setLinkedinUrl((String) body.get("linkedinUrl"));
        if (body.containsKey("githubUrl"))          c.setGithubUrl((String) body.get("githubUrl"));
        if (body.containsKey("experienceCategory")) c.setExperienceCategory((String) body.get("experienceCategory"));
        if (body.containsKey("experienceYears"))    c.setExperienceYears(toInt(body.get("experienceYears")));
        if (body.containsKey("experienceMonths"))   c.setExperienceMonths(toInt(body.get("experienceMonths")));
        if (body.containsKey("skills"))             c.setSkills(toList(body.get("skills")));
        if (body.containsKey("languages"))          c.setLanguages(toList(body.get("languages")));
        if (body.containsKey("rating"))             c.setRating(toDouble(body.get("rating")));
        if (completing) {
            c.setOnboardingCompleted(true);
            if (c.getStatus() == Counsellor.Status.REJECTED) {
                c.setStatus(Counsellor.Status.PENDING);
                c.setRejectionReason(null);
            } else {
                c.setStatus(Counsellor.Status.PENDING);
            }
        }
        if (c.getStatus() == null) c.setStatus(Counsellor.Status.PENDING);
        return ResponseEntity.ok(ApiResponse.ok(counsellorRepo.save(c)));
    }

    // ── Onboarding ────────────────────────────────────────────────────────────

    @GetMapping("/onboarding/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOnboardingStatus(@AuthenticationPrincipal User user) {
        Counsellor c = get(user);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("onboardingCompleted", c.isOnboardingCompleted());
        result.put("status", c.getStatus() != null ? c.getStatus().name() : "PENDING");
        result.put("rejectionReason", c.getRejectionReason());
        result.put("pendingProfileUpdate", c.isPendingProfileUpdate());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── Dashboard Analytics ───────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard(@AuthenticationPrincipal User user) {
        Counsellor c = get(user);

        List<com.hubblehox.e2j.entity.StudentBooking> bookings = bookingRepo.findByCounsellorOrderByCreatedAtDesc(c);
        long totalBooked    = bookings.size();
        long totalCompleted = bookings.stream().filter(b -> b.getStatus() == com.hubblehox.e2j.entity.StudentBooking.Status.COMPLETED).count();
        long totalConfirmed = bookings.stream().filter(b -> b.getStatus() == com.hubblehox.e2j.entity.StudentBooking.Status.CONFIRMED).count();
        long totalSlots     = sessionRepo.countByCounsellor(c);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalSessionsAvailable", totalSlots);
        data.put("totalSessionsBooked",    totalBooked);
        data.put("totalSessionsCompleted", totalCompleted);
        data.put("availability", Map.of("available", totalConfirmed, "unavailable", totalBooked - totalConfirmed));

        // Specialization — real skills from profile
        List<Map<String, Object>> skillMap = new ArrayList<>();
        List<String> skills = c.getSkills() != null ? c.getSkills() : List.of();
        for (int i = 0; i < Math.min(skills.size(), 6); i++) {
            skillMap.add(Map.of("skill", skills.get(i), "sessions", totalBooked > 0 ? totalBooked : 1));
        }
        data.put("specializationMap", skillMap);

        // Utilization by day — count bookings per day of week
        java.util.Map<String, Long> dayCount = new java.util.LinkedHashMap<>();
        String[] dayOrder = {"Mon","Tue","Wed","Thu","Fri","Sat","Sun"};
        for (String d : dayOrder) dayCount.put(d, 0L);
        for (com.hubblehox.e2j.entity.StudentBooking b : bookings) {
            try {
                java.time.LocalDate date = java.time.LocalDate.parse(b.getSessionDate());
                String dayName = date.getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH);
                dayCount.merge(dayName, 1L, Long::sum);
            } catch (Exception ignored) {}
        }
        List<Map<String, Object>> utilization = new ArrayList<>();
        for (String d : dayOrder) utilization.add(Map.of("day", d, "hours", dayCount.get(d)));
        data.put("utilizationByDay", utilization);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    // ── Education ─────────────────────────────────────────────────────────────

    @GetMapping("/education")
    public ResponseEntity<ApiResponse<List<CounsellorEducation>>> getEducation(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(educationRepo.findByCounsellor(get(user))));
    }

    @PostMapping("/education")
    public ResponseEntity<ApiResponse<CounsellorEducation>> addEducation(
            @AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        CounsellorEducation e = CounsellorEducation.builder()
                .counsellor(get(user))
                .degree((String) body.get("degree"))
                .schoolName((String) body.get("schoolName"))
                .major((String) body.get("major"))
                .designation((String) body.get("designation"))
                .yearOfPassing((String) body.get("yearOfPassing"))
                .currentlyPursuing(Boolean.TRUE.equals(body.get("currentlyPursuing")))
                .percentageType((String) body.get("percentageType"))
                .percentageValue(body.get("percentageValue") instanceof Number n ? n.doubleValue() : null)
                .build();
        return ResponseEntity.ok(ApiResponse.ok(educationRepo.save(e), "Education added"));
    }

    @PutMapping("/education/{id}")
    public ResponseEntity<ApiResponse<CounsellorEducation>> updateEducation(
            @AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        Counsellor c = get(user);
        CounsellorEducation e = educationRepo.findById(id)
                .filter(ed -> ed.getCounsellor().getId().equals(c.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        if (body.containsKey("degree"))          e.setDegree((String) body.get("degree"));
        if (body.containsKey("schoolName"))      e.setSchoolName((String) body.get("schoolName"));
        if (body.containsKey("major"))           e.setMajor((String) body.get("major"));
        if (body.containsKey("designation"))     e.setDesignation((String) body.get("designation"));
        if (body.containsKey("yearOfPassing"))   e.setYearOfPassing((String) body.get("yearOfPassing"));
        if (body.containsKey("percentageValue")) e.setPercentageValue(body.get("percentageValue") instanceof Number n ? n.doubleValue() : null);
        return ResponseEntity.ok(ApiResponse.ok(educationRepo.save(e), "Updated"));
    }

    @DeleteMapping("/education/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEducation(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Counsellor c = get(user);
        CounsellorEducation e = educationRepo.findById(id)
                .filter(ed -> ed.getCounsellor().getId().equals(c.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        educationRepo.delete(e);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    // ── Work Experience ───────────────────────────────────────────────────────

    @GetMapping("/work-experience")
    public ResponseEntity<ApiResponse<List<CounsellorWorkExperience>>> getWorkExp(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(workExpRepo.findByCounsellor(get(user))));
    }

    @PostMapping("/work-experience")
    public ResponseEntity<ApiResponse<CounsellorWorkExperience>> addWorkExp(
            @AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        CounsellorWorkExperience w = CounsellorWorkExperience.builder()
                .counsellor(get(user))
                .companyName((String) body.get("companyName"))
                .employmentType((String) body.get("employmentType"))
                .location((String) body.get("location"))
                .locationType((String) body.get("locationType"))
                .fromDate((String) body.get("fromDate"))
                .toDate((String) body.get("toDate"))
                .currentlyWorking(Boolean.TRUE.equals(body.get("currentlyWorking")))
                .description((String) body.get("description"))
                .build();
        return ResponseEntity.ok(ApiResponse.ok(workExpRepo.save(w), "Work experience added"));
    }

    @PutMapping("/work-experience/{id}")
    public ResponseEntity<ApiResponse<CounsellorWorkExperience>> updateWorkExp(
            @AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        Counsellor c = get(user);
        CounsellorWorkExperience w = workExpRepo.findById(id)
                .filter(wx -> wx.getCounsellor().getId().equals(c.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        if (body.containsKey("companyName"))    w.setCompanyName((String) body.get("companyName"));
        if (body.containsKey("employmentType")) w.setEmploymentType((String) body.get("employmentType"));
        if (body.containsKey("location"))       w.setLocation((String) body.get("location"));
        if (body.containsKey("locationType"))   w.setLocationType((String) body.get("locationType"));
        if (body.containsKey("fromDate"))       w.setFromDate((String) body.get("fromDate"));
        if (body.containsKey("toDate"))         w.setToDate((String) body.get("toDate"));
        if (body.containsKey("currentlyWorking")) w.setCurrentlyWorking(Boolean.TRUE.equals(body.get("currentlyWorking")));
        return ResponseEntity.ok(ApiResponse.ok(workExpRepo.save(w), "Updated"));
    }

    @DeleteMapping("/work-experience/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkExp(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Counsellor c = get(user);
        CounsellorWorkExperience w = workExpRepo.findById(id)
                .filter(wx -> wx.getCounsellor().getId().equals(c.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        workExpRepo.delete(w);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    // ── Certifications ────────────────────────────────────────────────────────

    @GetMapping("/certifications")
    public ResponseEntity<ApiResponse<List<CounsellorCertification>>> getCerts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(certRepo.findByCounsellor(get(user))));
    }

    @PostMapping("/certifications")
    public ResponseEntity<ApiResponse<CounsellorCertification>> addCert(
            @AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        CounsellorCertification cert = CounsellorCertification.builder()
                .counsellor(get(user))
                .certificateId((String) body.get("certificateId"))
                .certificateName((String) body.get("certificateName"))
                .awardingInstitute((String) body.get("awardingInstitute"))
                .validTill((String) body.get("validTill"))
                .documentUrl((String) body.get("documentUrl"))
                .build();
        return ResponseEntity.ok(ApiResponse.ok(certRepo.save(cert), "Certification added"));
    }

    @PutMapping("/certifications/{id}")
    public ResponseEntity<ApiResponse<CounsellorCertification>> updateCert(
            @AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        Counsellor c = get(user);
        CounsellorCertification cert = certRepo.findById(id)
                .filter(ct -> ct.getCounsellor().getId().equals(c.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        if (body.containsKey("certificateId"))   cert.setCertificateId((String) body.get("certificateId"));
        if (body.containsKey("certificateName")) cert.setCertificateName((String) body.get("certificateName"));
        if (body.containsKey("awardingInstitute")) cert.setAwardingInstitute((String) body.get("awardingInstitute"));
        if (body.containsKey("validTill"))       cert.setValidTill((String) body.get("validTill"));
        return ResponseEntity.ok(ApiResponse.ok(certRepo.save(cert), "Updated"));
    }

    @DeleteMapping("/certifications/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCert(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Counsellor c = get(user);
        CounsellorCertification cert = certRepo.findById(id)
                .filter(ct -> ct.getCounsellor().getId().equals(c.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        certRepo.delete(cert);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    // ── Sessions / Availability ───────────────────────────────────────────────

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<Page<CounsellorSession>>> getSessions(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        Counsellor c = get(user);
        Page<CounsellorSession> result = status != null
                ? sessionRepo.findByCounsellorAndStatus(c, CounsellorSession.Status.valueOf(status.toUpperCase()), PageRequest.of(page, size))
                : sessionRepo.findByCounsellor(c, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/sessions/availability")
    public ResponseEntity<ApiResponse<CounsellorSession>> addAvailability(
            @AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        CounsellorSession s = CounsellorSession.builder()
                .counsellor(get(user))
                .dateFrom((String) body.get("dateFrom"))
                .dateTo((String) body.get("dateTo"))
                .recurWeeks(body.get("recurWeeks") instanceof Number n ? n.intValue() : null)
                .days(toList(body.get("days")))
                .timeSlots(toList(body.get("timeSlots")))
                .feeAmount(body.get("feeAmount") instanceof Number n ? n.doubleValue() : null)
                .feeType((String) body.get("feeType"))
                .status(CounsellorSession.Status.AVAILABLE)
                .build();
        return ResponseEntity.ok(ApiResponse.ok(sessionRepo.save(s), "Availability added"));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBookings(@AuthenticationPrincipal User user) {
        Counsellor c = get(user);
        List<Map<String, Object>> result = bookingRepo.findByCounsellorOrderByCreatedAtDesc(c).stream()
                .map(b -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", b.getId());
                    m.put("studentName", b.getStudent().getUser().getName());
                    m.put("studentEmail", b.getStudent().getUser().getEmail());
                    m.put("sessionDate", b.getSessionDate());
                    m.put("sessionTime", b.getSessionTime());
                    m.put("feeAmount", b.getFeeAmount());
                    m.put("status", b.getStatus().name());
                    m.put("meetLink", b.getMeetLink());
                    m.put("createdAt", b.getCreatedAt());
                    if (b.getQ1Interests() != null || b.getQ2CareerGoal() != null) {
                        Map<String, String> qa = new LinkedHashMap<>();
                        qa.put("What Are Your Interests?", b.getQ1Interests());
                        qa.put("What Is Your Career Goal?", b.getQ2CareerGoal());
                        qa.put("Which Industry Are You Most Interested In Working In?", b.getQ3Industry());
                        qa.put("What Skills Are You Interested In Acquiring?", b.getQ4Skills());
                        qa.put("What Challenges Are You Currently Facing In Your Career Journey?", b.getQ5Challenges());
                        m.put("questionnaire", qa);
                    }
                    // Attach latest psychometric report for this student if available
                    psychometricReportRepo
                        .findTopByStudentOrderByCreatedAtDesc(b.getStudent())
                        .ifPresent(r -> m.put("psychometricReport", psychometricService.reportToMap(r)));
                    return m;
                }).toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PutMapping("/sessions/{id}/status")
    public ResponseEntity<ApiResponse<CounsellorSession>> updateSessionStatus(
            @AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody Map<String, String> body) {
        Counsellor c = get(user);
        CounsellorSession s = sessionRepo.findById(id)
                .filter(sx -> sx.getCounsellor().getId().equals(c.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        s.setStatus(CounsellorSession.Status.valueOf(body.get("status").toUpperCase()));
        if (body.containsKey("notes")) s.setNotes(body.get("notes"));
        return ResponseEntity.ok(ApiResponse.ok(sessionRepo.save(s), "Status updated"));
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Counsellor c = get(user);
        CounsellorSession s = sessionRepo.findById(id)
                .filter(sx -> sx.getCounsellor().getId().equals(c.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        sessionRepo.delete(s);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    // ── Report comment + email ────────────────────────────────────────────────

    @PostMapping("/bookings/{id}/report-comment")
    public ResponseEntity<ApiResponse<String>> sendReportComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        Counsellor c = get(user);
        StudentBooking booking = bookingRepo.findById(id)
                .filter(b -> b.getCounsellor().getId().equals(c.getId()))
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));

        String comment               = body.getOrDefault("comment", "").toString().strip();
        String keyObservations       = body.getOrDefault("keyObservations", "").toString().strip();
        String actionItems           = body.getOrDefault("actionItems", "").toString().strip();
        String resourcesRecommended  = body.getOrDefault("resourcesRecommended", "").toString().strip();
        String studentEmail          = booking.getStudent().getUser().getEmail();
        String studentName           = booking.getStudent().getUser().getName();

        PsychometricReport report = psychometricReportRepo
                .findTopByStudentOrderByCreatedAtDesc(booking.getStudent())
                .orElse(null);

        if (report != null) {
            if (!comment.isBlank())              report.setCounsellorComment(comment);
            if (!keyObservations.isBlank())      report.setFeedbackKeyObservations(keyObservations);
            if (!actionItems.isBlank())          report.setFeedbackActionItems(actionItems);
            if (!resourcesRecommended.isBlank()) report.setFeedbackResourcesRecommended(resourcesRecommended);
            report.setCounsellorName(c.getUser().getName());
            report.setCommentedAt(java.time.LocalDateTime.now());

            try {
                com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
                if (body.containsKey("ratings"))  report.setFeedbackRatingsJson(om.writeValueAsString(body.get("ratings")));
                if (body.containsKey("outcomes")) report.setFeedbackOutcomesJson(om.writeValueAsString(body.get("outcomes")));
            } catch (Exception ignored) {}

            psychometricReportRepo.save(report);
        }

        try {
            StringBuilder sb = new StringBuilder();
            sb.append("Dear ").append(studentName).append(",\n\n");
            sb.append("Your counsellor ").append(c.getUser().getName())
              .append(" has reviewed your psychometric report and shared the following feedback:\n\n");
            if (!comment.isBlank()) sb.append("Review:\n").append(comment).append("\n\n");
            if (!keyObservations.isBlank()) sb.append("Key Observations:\n").append(keyObservations).append("\n\n");
            if (!actionItems.isBlank()) sb.append("Your Action Items:\n").append(actionItems).append("\n\n");
            sb.append("Log in to the E2J platform to view your full report.\n\nRegards,\nHubbleHox E2J Team");
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(studentEmail);
            msg.setSubject("Your Career Report — Counsellor Feedback from " + c.getUser().getName());
            msg.setText(sb.toString());
            mailSender.send(msg);
        } catch (Exception ignored) {}

        return ResponseEntity.ok(ApiResponse.ok("Feedback saved"));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<String> toList(Object val) {
        if (val instanceof List<?> l) return new ArrayList<>(l.stream().map(Object::toString).toList());
        return new ArrayList<>();
    }

    private Integer toInt(Object val) {
        if (val instanceof Number n) return n.intValue();
        return null;
    }

    private Double toDouble(Object val) {
        if (val instanceof Number n) return n.doubleValue();
        return null;
    }
}
