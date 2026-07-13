package com.hubblehox.e2j.service;

import com.hubblehox.e2j.dto.WorkshopReviewDto;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkshopReviewService {

    private final WorkshopReviewRepository reviewRepo;
    private final WorkshopEnrollmentRepository enrollmentRepo;
    private final WorkshopPostingRepository workshopRepo;
    private final StudentRepository studentRepo;
    private final UserRepository userRepo;

    private Student getStudent(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        return studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
    }

    private boolean hasSessionPassed(WorkshopPosting w) {
        try {
            LocalDate date = LocalDate.parse(w.getSessionDate());
            LocalTime time = w.getSessionTime() != null ? LocalTime.parse(w.getSessionTime()) : LocalTime.MIDNIGHT;
            return LocalDateTime.of(date, time).isBefore(LocalDateTime.now());
        } catch (Exception e) {
            return true;
        }
    }

    @Transactional
    public WorkshopReviewDto.Response submit(String email, Long enrollmentId, WorkshopReviewDto.SubmitRequest req) {
        Student student = getStudent(email);
        WorkshopEnrollment enrollment = enrollmentRepo.findById(enrollmentId)
                .orElseThrow(() -> new AppException("Enrollment not found", HttpStatus.NOT_FOUND));
        if (!enrollment.getStudent().getId().equals(student.getId()))
            throw new AppException("Unauthorized", HttpStatus.FORBIDDEN);
        if (enrollment.getStatus() != WorkshopEnrollment.Status.CONFIRMED)
            throw new AppException("Only confirmed attendees can leave a review", HttpStatus.CONFLICT);
        if (!hasSessionPassed(enrollment.getWorkshop()))
            throw new AppException("Workshop hasn't happened yet", HttpStatus.CONFLICT);
        if (reviewRepo.findByEnrollment(enrollment).isPresent())
            throw new AppException("Review already submitted", HttpStatus.CONFLICT);

        WorkshopReview review = WorkshopReview.builder()
                .enrollment(enrollment)
                .trainerRating(req.getTrainerRating())
                .venueRating(req.getVenueRating())
                .overallRating(req.getOverallRating())
                .comment(req.getComment())
                .build();
        review = reviewRepo.save(review);

        recomputeRating(enrollment.getWorkshop());
        return toResponse(review);
    }

    private void recomputeRating(WorkshopPosting workshop) {
        Double avg = reviewRepo.computeAverageRating(workshop);
        workshop.setRating(avg != null ? Math.round(avg * 10.0) / 10.0 : null);
        workshopRepo.save(workshop);
    }

    public List<WorkshopReviewDto.Response> forWorkshop(Long workshopId) {
        WorkshopPosting workshop = workshopRepo.findById(workshopId)
                .orElseThrow(() -> new AppException("Workshop not found", HttpStatus.NOT_FOUND));
        return reviewRepo.findByWorkshop(workshop).stream().map(this::toResponse).toList();
    }

    private WorkshopReviewDto.Response toResponse(WorkshopReview r) {
        WorkshopEnrollment e = r.getEnrollment();
        return WorkshopReviewDto.Response.builder()
                .id(r.getId())
                .workshopId(e.getWorkshop().getId())
                .studentName(e.getStudent().getUser() != null ? e.getStudent().getUser().getName() : null)
                .trainerRating(r.getTrainerRating())
                .venueRating(r.getVenueRating())
                .overallRating(r.getOverallRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .build();
    }
}
