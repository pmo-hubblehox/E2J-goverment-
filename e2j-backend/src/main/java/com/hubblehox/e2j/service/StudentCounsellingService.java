package com.hubblehox.e2j.service;

import com.hubblehox.e2j.dto.StudentCounsellingDto;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentCounsellingService {

    private final StudentRepository studentRepo;
    private final CounsellorRepository counsellorRepo;
    private final CounsellorSessionRepository sessionRepo;
    private final StudentBookingRepository bookingRepo;
    private final CounsellorEducationRepository educationRepo;
    private final CounsellorWorkExperienceRepository workExpRepo;
    private final CounsellorCertificationRepository certRepo;
    private final com.hubblehox.e2j.repository.CounsellorReviewRepository reviewRepo;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter LABEL_FMT = DateTimeFormatter.ofPattern("dd MMM").withLocale(Locale.ENGLISH);

    public StudentCounsellingDto.CounsellorProfile getCounsellorProfile(Long counsellorId) {
        Counsellor c = counsellorRepo.findById(counsellorId)
                .orElseThrow(() -> new AppException("Counsellor not found", HttpStatus.NOT_FOUND));

        List<CounsellorSession> sessions = sessionRepo.findByCounsellorOrderByCreatedAtDesc(c);
        Double fee = sessions.stream().map(CounsellorSession::getFeeAmount).filter(Objects::nonNull).findFirst().orElse(0.0);
        String feeType = sessions.stream().map(CounsellorSession::getFeeType).filter(Objects::nonNull).findFirst().orElse("per session");

        List<StudentCounsellingDto.EducationItem> education = educationRepo.findByCounsellor(c).stream()
                .map(e -> StudentCounsellingDto.EducationItem.builder()
                        .degree(e.getDegree()).schoolName(e.getSchoolName())
                        .major(e.getMajor()).yearOfPassing(e.getYearOfPassing()).build())
                .collect(Collectors.toList());

        List<StudentCounsellingDto.WorkItem> work = workExpRepo.findByCounsellor(c).stream()
                .map(w -> StudentCounsellingDto.WorkItem.builder()
                        .companyName(w.getCompanyName()).employmentType(w.getEmploymentType())
                        .fromDate(w.getFromDate()).toDate(w.getToDate())
                        .currentlyWorking(w.getCurrentlyWorking()).description(w.getDescription()).build())
                .collect(Collectors.toList());

        List<StudentCounsellingDto.CertItem> certs = certRepo.findByCounsellor(c).stream()
                .map(cr -> StudentCounsellingDto.CertItem.builder()
                        .certificateName(cr.getCertificateName()).awardingInstitute(cr.getAwardingInstitute())
                        .validTill(cr.getValidTill()).build())
                .collect(Collectors.toList());

        return StudentCounsellingDto.CounsellorProfile.builder()
                .id(c.getId()).name(c.getUser().getName()).email(c.getUser().getEmail())
                .photoUrl(c.getPhotoUrl()).specialty(c.getExperienceCategory())
                .experienceYears(c.getExperienceYears()).experienceMonths(c.getExperienceMonths())
                .skills(c.getSkills()).feeAmount(fee).feeType(feeType)
                .linkedinUrl(c.getLinkedinUrl()).city(c.getCity()).state(c.getState())
                .education(education).workExperience(work).certifications(certs)
                .build();
    }

    public List<StudentCounsellingDto.CounsellorCard> listApprovedCounsellors() {
        return counsellorRepo.findByStatus(Counsellor.Status.APPROVED).stream()
                .map(c -> {
                    List<CounsellorSession> sessions = sessionRepo.findByCounsellorOrderByCreatedAtDesc(c);
                    Double fee = sessions.stream()
                            .map(CounsellorSession::getFeeAmount)
                            .filter(Objects::nonNull)
                            .findFirst().orElse(0.0);
                    String feeType = sessions.stream()
                            .map(CounsellorSession::getFeeType)
                            .filter(Objects::nonNull)
                            .findFirst().orElse("per session");
                    return StudentCounsellingDto.CounsellorCard.builder()
                            .id(c.getId())
                            .name(c.getUser().getName())
                            .email(c.getUser().getEmail())
                            .photoUrl(c.getPhotoUrl())
                            .specialty(c.getExperienceCategory())
                            .experienceYears(c.getExperienceYears())
                            .experienceMonths(c.getExperienceMonths())
                            .skills(c.getSkills())
                            .languages(c.getLanguages())
                            .feeAmount(fee)
                            .feeType(feeType)
                            .rating(c.getRating() != null ? c.getRating() : 0.0)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<StudentCounsellingDto.SlotDay> getAvailableSlots(Long counsellorId) {
        Counsellor counsellor = counsellorRepo.findById(counsellorId)
                .orElseThrow(() -> new AppException("Counsellor not found", HttpStatus.NOT_FOUND));

        List<CounsellorSession> sessions = sessionRepo.findByCounsellorOrderByCreatedAtDesc(counsellor);
        Set<String> bookedKeys = bookingRepo.findBookedSlotKeys(counsellor);

        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(30);

        // Map: date → available times
        Map<LocalDate, List<String>> slotMap = new LinkedHashMap<>();

        for (CounsellorSession session : sessions) {
            if (session.getDays() == null || session.getTimeSlots() == null) continue;
            LocalDate from = parseDate(session.getDateFrom(), today);
            LocalDate to = parseDate(session.getDateTo(), horizon);
            if (from == null || to == null) continue;

            Set<String> days = session.getDays().stream()
                    .map(String::toUpperCase).collect(Collectors.toSet());

            for (LocalDate d = from.isAfter(today) ? from : today.plusDays(1); !d.isAfter(to) && !d.isAfter(horizon); d = d.plusDays(1)) {
                String dayName = d.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH).toUpperCase();
                if (!days.contains(dayName)) continue;
                String dateStr = d.format(DATE_FMT);
                List<String> available = session.getTimeSlots().stream()
                        .filter(t -> !bookedKeys.contains(dateStr + "|" + t))
                        .collect(Collectors.toList());
                if (!available.isEmpty()) {
                    slotMap.computeIfAbsent(d, k -> new ArrayList<>()).addAll(available);
                }
            }
        }

        return slotMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    LocalDate d = e.getKey();
                    String dayShort = d.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH).toUpperCase();
                    return StudentCounsellingDto.SlotDay.builder()
                            .date(d.format(DATE_FMT))
                            .dayLabel(dayShort + " " + d.format(LABEL_FMT).toUpperCase())
                            .times(e.getValue())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public StudentCounsellingDto.BookingDetail bookSlot(User user, Long counsellorId, StudentCounsellingDto.BookRequest req) {
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
        Counsellor counsellor = counsellorRepo.findById(counsellorId)
                .orElseThrow(() -> new AppException("Counsellor not found", HttpStatus.NOT_FOUND));

        Set<String> booked = bookingRepo.findBookedSlotKeys(counsellor);
        String key = req.getSessionDate() + "|" + req.getSessionTime();
        if (booked.contains(key)) {
            throw new AppException("This slot has already been booked. Please choose another.", HttpStatus.CONFLICT);
        }

        String meetLink = "https://meet.google.com/" + UUID.randomUUID().toString().substring(0, 10);

        StudentBooking booking = StudentBooking.builder()
                .student(student)
                .counsellor(counsellor)
                .sessionDate(req.getSessionDate())
                .sessionTime(req.getSessionTime())
                .feeAmount(req.getFeeAmount())
                .meetLink(meetLink)
                .status(StudentBooking.Status.CONFIRMED)
                .psychometricReportId(req.getPsychometricReportId())
                .build();
        booking = bookingRepo.save(booking);

        return toDetail(booking);
    }

    public List<StudentCounsellingDto.BookingDetail> getMyBookings(User user) {
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
        return bookingRepo.findByStudentOrderByCreatedAtDesc(student).stream()
                .map(this::toDetail)
                .collect(Collectors.toList());
    }

    @Transactional
    public void saveQuestionnaire(User user, Long bookingId, Map<String, String> answers) {
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
        StudentBooking booking = bookingRepo.findById(bookingId)
                .filter(b -> b.getStudent().getId().equals(student.getId()))
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        booking.setQ1Interests(answers.get("q1"));
        booking.setQ2CareerGoal(answers.get("q2"));
        booking.setQ3Industry(answers.get("q3"));
        booking.setQ4Skills(answers.get("q4"));
        booking.setQ5Challenges(answers.get("q5"));
        bookingRepo.save(booking);
    }

    @Transactional
    public void submitFeedback(User user, Long bookingId, Map<String, Object> body) {
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
        StudentBooking booking = bookingRepo.findById(bookingId)
                .filter(b -> b.getStudent().getId().equals(student.getId()))
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        if (booking.getStatus() != StudentBooking.Status.COMPLETED)
            throw new AppException("Feedback only allowed for completed sessions", HttpStatus.BAD_REQUEST);
        if (reviewRepo.findByBooking(booking).isPresent())
            throw new AppException("Feedback already submitted", HttpStatus.CONFLICT);

        int q1 = toInt(body.get("q1")), q2 = toInt(body.get("q2")),
            q3 = toInt(body.get("q3")), q4 = toInt(body.get("q4"));
        String comment = body.getOrDefault("comment", "").toString().strip();

        com.hubblehox.e2j.entity.CounsellorReview review =
                com.hubblehox.e2j.entity.CounsellorReview.builder()
                        .booking(booking)
                        .counsellor(booking.getCounsellor())
                        .q1(q1).q2(q2).q3(q3).q4(q4)
                        .comment(comment.isBlank() ? null : comment)
                        .build();
        reviewRepo.save(review);

        // Recompute and persist counsellor average rating
        Double avg = reviewRepo.computeAverageRating(booking.getCounsellor());
        if (avg != null) {
            booking.getCounsellor().setRating(Math.round(avg * 10.0) / 10.0);
            counsellorRepo.save(booking.getCounsellor());
        }
    }

    private int toInt(Object v) {
        if (v == null) return 0;
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return 0; }
    }

    private StudentCounsellingDto.BookingDetail toDetail(StudentBooking b) {
        return StudentCounsellingDto.BookingDetail.builder()
                .id(b.getId())
                .counsellorId(b.getCounsellor().getId())
                .counsellorName(b.getCounsellor().getUser().getName())
                .counsellorPhoto(b.getCounsellor().getPhotoUrl())
                .specialty(b.getCounsellor().getExperienceCategory())
                .sessionDate(b.getSessionDate())
                .sessionTime(b.getSessionTime())
                .feeAmount(b.getFeeAmount())
                .status(b.getStatus().name())
                .meetLink(b.getMeetLink())
                .createdAt(b.getCreatedAt())
                .hasFeedback(reviewRepo.findByBooking(b).isPresent())
                .build();
    }

    private LocalDate parseDate(String s, LocalDate fallback) {
        if (s == null || s.isBlank()) return fallback;
        try { return LocalDate.parse(s, DATE_FMT); } catch (Exception e) { return fallback; }
    }
}
