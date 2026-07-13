package com.hubblehox.e2j.service;

import com.hubblehox.e2j.dto.WorkshopEnrollmentDto;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkshopEnrollmentService {

    private final WorkshopEnrollmentRepository enrollmentRepo;
    private final WorkshopPostingRepository workshopRepo;
    private final StudentRepository studentRepo;
    private final InstituteStudentRepository instituteStudentRepo;
    private final UserRepository userRepo;
    private final JavaMailSender mailSender;

    private Student getStudent(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        return studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
    }

    private WorkshopPosting getWorkshop(Long id) {
        return workshopRepo.findById(id)
                .orElseThrow(() -> new AppException("Workshop not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public WorkshopEnrollmentDto.Response enroll(String email, Long workshopId, String formAnswer) {
        Student student = getStudent(email);
        WorkshopPosting workshop = getWorkshop(workshopId);
        if (workshop.getStatus() != WorkshopPosting.Status.APPROVED)
            throw new AppException("Workshop is not open for enrollment", HttpStatus.CONFLICT);
        if (enrollmentRepo.findByWorkshopAndStudent(workshop, student).isPresent())
            throw new AppException("Already enrolled in this workshop", HttpStatus.CONFLICT);

        WorkshopEnrollment enrollment = place(workshop, student, null, formAnswer);
        notifyStudent(enrollment);
        return toResponse(enrollment);
    }

    private WorkshopEnrollment place(WorkshopPosting workshop, Student student, Institute enrolledByInstitute, String formAnswer) {
        long confirmedCount = enrollmentRepo.countByWorkshopAndStatus(workshop, WorkshopEnrollment.Status.CONFIRMED);
        boolean hasSeat = workshop.getTotalSeats() != null && confirmedCount < workshop.getTotalSeats();

        WorkshopEnrollment.WorkshopEnrollmentBuilder builder = WorkshopEnrollment.builder()
                .workshop(workshop)
                .student(student)
                .enrolledByInstitute(enrolledByInstitute)
                .formAnswer(formAnswer)
                .feeAmount(workshop.getFeeAmount());

        if (hasSeat) {
            builder.status(WorkshopEnrollment.Status.CONFIRMED);
        } else {
            long waitlistCount = enrollmentRepo.countByWorkshopAndStatus(workshop, WorkshopEnrollment.Status.WAITLISTED);
            builder.status(WorkshopEnrollment.Status.WAITLISTED).waitlistPosition((int) waitlistCount + 1);
        }
        return enrollmentRepo.save(builder.build());
    }

    public List<WorkshopEnrollmentDto.Response> myEnrollments(String email) {
        Student student = getStudent(email);
        return enrollmentRepo.findByStudentOrderByCreatedAtDesc(student).stream()
                .map(this::toResponse).toList();
    }

    public List<WorkshopEnrollmentDto.RosterRow> rosterForWorkshop(WorkshopPosting workshop) {
        return enrollmentRepo.findByWorkshopOrderByCreatedAtAsc(workshop).stream()
                .filter(e -> e.getStatus() != WorkshopEnrollment.Status.CANCELLED)
                .map(e -> WorkshopEnrollmentDto.RosterRow.builder()
                        .id(e.getId())
                        .studentName(e.getStudent().getUser() != null ? e.getStudent().getUser().getName() : null)
                        .studentEmail(e.getStudent().getUser() != null ? e.getStudent().getUser().getEmail() : null)
                        .status(e.getStatus().name())
                        .waitlistPosition(e.getWaitlistPosition())
                        .formAnswer(e.getFormAnswer())
                        .enrolledVia(e.getEnrolledByInstitute() != null ? "Institute: " + e.getEnrolledByInstitute().getName() : "Self")
                        .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                        .build())
                .toList();
    }

    @Transactional
    public WorkshopEnrollmentDto.Response cancel(String email, Long enrollmentId) {
        Student student = getStudent(email);
        WorkshopEnrollment enrollment = enrollmentRepo.findById(enrollmentId)
                .orElseThrow(() -> new AppException("Enrollment not found", HttpStatus.NOT_FOUND));
        if (!enrollment.getStudent().getId().equals(student.getId()))
            throw new AppException("Unauthorized", HttpStatus.FORBIDDEN);
        if (enrollment.getStatus() == WorkshopEnrollment.Status.CANCELLED)
            throw new AppException("Already cancelled", HttpStatus.CONFLICT);

        boolean wasConfirmed = enrollment.getStatus() == WorkshopEnrollment.Status.CONFIRMED;
        enrollment.setStatus(WorkshopEnrollment.Status.CANCELLED);
        enrollmentRepo.save(enrollment);

        if (wasConfirmed) bumpNextWaitlisted(enrollment.getWorkshop());
        return toResponse(enrollment);
    }

    private void bumpNextWaitlisted(WorkshopPosting workshop) {
        List<WorkshopEnrollment> waitlist = enrollmentRepo
                .findByWorkshopAndStatusOrderByWaitlistPositionAsc(workshop, WorkshopEnrollment.Status.WAITLISTED);
        if (waitlist.isEmpty()) return;
        WorkshopEnrollment next = waitlist.get(0);
        next.setStatus(WorkshopEnrollment.Status.CONFIRMED);
        next.setWaitlistPosition(null);
        enrollmentRepo.save(next);
        notifyStudent(next);
    }

    @Transactional
    public WorkshopEnrollmentDto.BulkEnrollResult bulkEnroll(Institute institute, Long workshopId, List<Long> instituteStudentIds) {
        WorkshopPosting workshop = getWorkshop(workshopId);
        if (workshop.getStatus() != WorkshopPosting.Status.APPROVED)
            throw new AppException("Workshop is not open for enrollment", HttpStatus.CONFLICT);

        int confirmed = 0, waitlisted = 0, skipped = 0;
        List<InstituteStudent> roster = instituteStudentRepo.findAllById(instituteStudentIds);

        for (InstituteStudent is : roster) {
            if (is.getInstitute() == null || !is.getInstitute().getId().equals(institute.getId())) { skipped++; continue; }
            if (is.getEmail() == null || is.getEmail().isBlank()) { skipped++; continue; }
            Student student = studentRepo.findByUser_Email(is.getEmail()).orElse(null);
            if (student == null) { skipped++; continue; }
            if (enrollmentRepo.findByWorkshopAndStudent(workshop, student).isPresent()) { skipped++; continue; }

            WorkshopEnrollment enrollment = place(workshop, student, institute, null);
            notifyStudent(enrollment);
            if (enrollment.getStatus() == WorkshopEnrollment.Status.CONFIRMED) confirmed++;
            else waitlisted++;
        }

        return WorkshopEnrollmentDto.BulkEnrollResult.builder()
                .totalRequested(instituteStudentIds.size())
                .confirmed(confirmed)
                .waitlisted(waitlisted)
                .skipped(skipped)
                .build();
    }

    private void notifyStudent(WorkshopEnrollment enrollment) {
        try {
            String email = enrollment.getStudent().getUser().getEmail();
            WorkshopPosting w = enrollment.getWorkshop();
            boolean confirmed = enrollment.getStatus() == WorkshopEnrollment.Status.CONFIRMED;
            StringBuilder sb = new StringBuilder();
            sb.append("Dear ").append(enrollment.getStudent().getUser().getName()).append(",\n\n");
            if (confirmed) {
                sb.append("You're confirmed for \"").append(w.getTitle()).append("\" on ")
                  .append(w.getSessionDate()).append(" ").append(w.getSessionTime()).append(".\n\n");
                if (w.getMode() == WorkshopPosting.Mode.ONLINE) sb.append("Meeting link: ").append(w.getMeetingLink()).append("\n");
                else sb.append("Venue: ").append(w.getVenueAddress()).append("\n");
            } else {
                sb.append("You've been waitlisted for \"").append(w.getTitle())
                  .append("\" (position ").append(enrollment.getWaitlistPosition()).append("). We'll confirm your seat automatically if one opens up.\n");
            }
            sb.append("\nRegards,\nHubbleHox E2J Team");
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(email);
            msg.setSubject((confirmed ? "Workshop Confirmed: " : "Workshop Waitlisted: ") + w.getTitle());
            msg.setText(sb.toString());
            mailSender.send(msg);
        } catch (Exception ignored) {}
    }

    private WorkshopEnrollmentDto.Response toResponse(WorkshopEnrollment e) {
        WorkshopPosting w = e.getWorkshop();
        return WorkshopEnrollmentDto.Response.builder()
                .id(e.getId())
                .workshopId(w.getId())
                .workshopTitle(w.getTitle())
                .mode(w.getMode() != null ? w.getMode().name() : null)
                .sessionDate(w.getSessionDate())
                .sessionTime(w.getSessionTime())
                .meetingLink(w.getMeetingLink())
                .venueAddress(w.getVenueAddress())
                .status(e.getStatus().name())
                .waitlistPosition(e.getWaitlistPosition())
                .feeAmount(e.getFeeAmount())
                .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .build();
    }
}
