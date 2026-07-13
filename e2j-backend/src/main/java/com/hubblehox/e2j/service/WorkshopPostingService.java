package com.hubblehox.e2j.service;

import com.hubblehox.e2j.dto.WorkshopPostingDto;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkshopPostingService {

    private final WorkshopPostingRepository workshopRepo;
    private final WorkshopEnrollmentRepository enrollmentRepo;
    private final StudentRepository studentRepo;
    private final StudentAspirationRepository aspirationRepo;
    private final UserRepository userRepo;
    private final IndustrySmeRepository industrySmeRepo;
    private final FacultyRepository facultyRepo;
    private final WorkshopTrainerService workshopTrainerService;

    private Student getStudent(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        return studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public WorkshopPostingDto.Response createForIndustry(IndustryPartner partner, WorkshopPostingDto.CreateRequest req) {
        WorkshopTrainer trainer = resolveIndustryTrainer(partner, req);
        WorkshopPosting w = new WorkshopPosting();
        w.setIndustryPartner(partner);
        applyFields(w, req, trainer);
        return toResponse(workshopRepo.save(w));
    }

    @Transactional
    public WorkshopPostingDto.Response createForInstitute(Institute institute, WorkshopPostingDto.CreateRequest req) {
        WorkshopTrainer trainer = resolveInstituteTrainer(institute, req);
        WorkshopPosting w = new WorkshopPosting();
        w.setInstitute(institute);
        applyFields(w, req, trainer);
        return toResponse(workshopRepo.save(w));
    }

    @Transactional
    public WorkshopPostingDto.Response updateForIndustry(IndustryPartner partner, Long id, WorkshopPostingDto.CreateRequest req) {
        WorkshopPosting w = findById(id);
        if (w.getIndustryPartner() == null || !w.getIndustryPartner().getId().equals(partner.getId()))
            throw new AppException("Unauthorized", HttpStatus.FORBIDDEN);
        WorkshopTrainer trainer = resolveIndustryTrainer(partner, req);
        applyFields(w, req, trainer);
        return toResponse(workshopRepo.save(w));
    }

    @Transactional
    public WorkshopPostingDto.Response updateForInstitute(Institute institute, Long id, WorkshopPostingDto.CreateRequest req) {
        WorkshopPosting w = findById(id);
        if (w.getInstitute() == null || !w.getInstitute().getId().equals(institute.getId()))
            throw new AppException("Unauthorized", HttpStatus.FORBIDDEN);
        WorkshopTrainer trainer = resolveInstituteTrainer(institute, req);
        applyFields(w, req, trainer);
        return toResponse(workshopRepo.save(w));
    }

    private WorkshopTrainer resolveIndustryTrainer(IndustryPartner partner, WorkshopPostingDto.CreateRequest req) {
        if (req.getIndustrySmeId() == null) return null;
        IndustrySme sme = industrySmeRepo.findByIdAndPartner(req.getIndustrySmeId(), partner)
                .orElseThrow(() -> new AppException("SME not found", HttpStatus.NOT_FOUND));
        return workshopTrainerService.getOrCreateFromIndustrySme(sme);
    }

    private WorkshopTrainer resolveInstituteTrainer(Institute institute, WorkshopPostingDto.CreateRequest req) {
        if (req.getFacultyId() == null) return null;
        Faculty faculty = facultyRepo.findById(req.getFacultyId())
                .filter(f -> f.getInstitute().getId().equals(institute.getId()))
                .orElseThrow(() -> new AppException("Faculty not found", HttpStatus.NOT_FOUND));
        return workshopTrainerService.getOrCreateFromFaculty(faculty);
    }

    /** Applies posted fields onto (new or existing) workshop and always (re)sets it to PENDING — every create/edit must go back through Verifier approval. */
    private void applyFields(WorkshopPosting w, WorkshopPostingDto.CreateRequest req, WorkshopTrainer trainer) {
        WorkshopPosting.Mode mode = WorkshopPosting.Mode.valueOf(req.getMode());

        w.setTrainer(trainer);
        w.setTitle(req.getTitle());
        w.setDescription(req.getDescription());
        w.setTargetRole(req.getTargetRole());
        w.setMode(mode);
        w.setSessionDate(req.getSessionDate());
        w.setSessionTime(req.getSessionTime());
        w.setDurationMinutes(req.getDurationMinutes());
        w.setFeeAmount(req.getFeeAmount());
        w.setTotalSeats(req.getTotalSeats());
        w.setCustomQuestion(req.getCustomQuestion());
        w.setStatus(WorkshopPosting.Status.PENDING);
        w.setRejectionReason(null);

        if (mode == WorkshopPosting.Mode.IN_PERSON) {
            w.setCity(req.getCity());
            w.setState(req.getState());
            w.setVenueAddress(req.getVenueAddress());
            w.setMeetingLink(null);
        } else {
            w.setCity(null);
            w.setState(null);
            w.setVenueAddress(null);
            if (w.getMeetingLink() == null)
                w.setMeetingLink("https://meet.google.com/" + UUID.randomUUID().toString().substring(0, 10));
        }
    }

    public List<WorkshopPostingDto.Response> listForIndustry(IndustryPartner partner) {
        return workshopRepo.findByIndustryPartnerOrderByCreatedAtDesc(partner).stream()
                .map(this::toResponse).toList();
    }

    public List<WorkshopPostingDto.Response> listForInstitute(Institute institute) {
        return workshopRepo.findByInstituteOrderByCreatedAtDesc(institute).stream()
                .map(this::toResponse).toList();
    }

    public List<WorkshopPostingDto.Response> listPending() {
        return workshopRepo.findByStatusOrderByCreatedAtDesc(WorkshopPosting.Status.PENDING).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public WorkshopPostingDto.Response approve(Long id) {
        WorkshopPosting w = findById(id);
        w.setStatus(WorkshopPosting.Status.APPROVED);
        return toResponse(workshopRepo.save(w));
    }

    @Transactional
    public WorkshopPostingDto.Response reject(Long id, String reason) {
        WorkshopPosting w = findById(id);
        w.setStatus(WorkshopPosting.Status.REJECTED);
        w.setRejectionReason(reason);
        return toResponse(workshopRepo.save(w));
    }

    public List<WorkshopPostingDto.Response> listApprovedForInstitute() {
        return workshopRepo.findByStatusOrderByCreatedAtDesc(WorkshopPosting.Status.APPROVED).stream()
                .map(this::toResponse).toList();
    }

    public List<WorkshopPostingDto.Response> browseForStudent(String email, String mode, String scope, String role) {
        Student student = getStudent(email);
        boolean recommendedOnly = "recommended".equalsIgnoreCase(scope);

        List<String> targetRoles;
        if (role != null && !role.isBlank()) {
            targetRoles = List.of(role);
        } else if (recommendedOnly) {
            targetRoles = aspirationRepo.findByStudentOrderByCreatedAtDesc(student).stream()
                    .map(StudentAspiration::getRoleArea)
                    .filter(r -> r != null && !r.isBlank())
                    .toList();
        } else {
            targetRoles = List.of();
        }

        List<WorkshopPosting> matches = workshopRepo.findByStatusOrderByCreatedAtDesc(WorkshopPosting.Status.APPROVED)
                .stream()
                .filter(w -> targetRoles.isEmpty() || targetRoles.stream().anyMatch(r -> roleMatches(r, w.getTargetRole())))
                .filter(w -> mode == null || mode.isBlank() || w.getMode().name().equalsIgnoreCase(mode))
                .toList();

        String studentCity = student.getCity();
        return matches.stream()
                .sorted(Comparator.comparingInt(w -> distanceRank((WorkshopPosting) w, studentCity)))
                .map(this::toResponse)
                .toList();
    }

    /** Tolerant role match — exact/case-insensitive first, falls back to small-edit-distance match so minor typos in a free-text role field don't hide a workshop. */
    private boolean roleMatches(String aspirationRole, String workshopTargetRole) {
        if (aspirationRole == null || workshopTargetRole == null) return false;
        String a = aspirationRole.trim().toLowerCase();
        String b = workshopTargetRole.trim().toLowerCase();
        if (a.equals(b)) return true;
        int maxLen = Math.max(a.length(), b.length());
        int allowedDistance = maxLen <= 6 ? 1 : 2;
        return levenshtein(a, b) <= allowedDistance;
    }

    private int levenshtein(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }
        return dp[a.length()][b.length()];
    }

    private int distanceRank(WorkshopPosting w, String studentCity) {
        if (w.getMode() != WorkshopPosting.Mode.IN_PERSON || studentCity == null || studentCity.isBlank()) return 2;
        if (studentCity.equalsIgnoreCase(w.getCity())) return 0;
        return 1;
    }

    public WorkshopPostingDto.Response getDetail(Long id) {
        return toResponse(findById(id));
    }

    public WorkshopPosting findById(Long id) {
        return workshopRepo.findById(id)
                .orElseThrow(() -> new AppException("Workshop not found", HttpStatus.NOT_FOUND));
    }

    private WorkshopPostingDto.Response toResponse(WorkshopPosting w) {
        String posterName = w.getIndustryPartner() != null ? w.getIndustryPartner().getRegisteredName()
                : w.getInstitute() != null ? w.getInstitute().getName() : null;
        int confirmed = (int) enrollmentRepo.countByWorkshopAndStatus(w, WorkshopEnrollment.Status.CONFIRMED);

        return WorkshopPostingDto.Response.builder()
                .id(w.getId())
                .posterName(posterName)
                .trainerName(w.getTrainer() != null ? w.getTrainer().getName() : null)
                .title(w.getTitle())
                .description(w.getDescription())
                .targetRole(w.getTargetRole())
                .mode(w.getMode() != null ? w.getMode().name() : null)
                .sessionDate(w.getSessionDate())
                .sessionTime(w.getSessionTime())
                .durationMinutes(w.getDurationMinutes())
                .city(w.getCity())
                .state(w.getState())
                .venueAddress(w.getVenueAddress())
                .meetingLink(w.getMeetingLink())
                .feeAmount(w.getFeeAmount())
                .totalSeats(w.getTotalSeats())
                .seatsConfirmed(confirmed)
                .status(w.getStatus() != null ? w.getStatus().name() : null)
                .rejectionReason(w.getRejectionReason())
                .rating(w.getRating())
                .createdAt(w.getCreatedAt() != null ? w.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .customQuestion(w.getCustomQuestion())
                .industrySmeId(w.getTrainer() != null ? w.getTrainer().getIndustrySmeId() : null)
                .facultyId(w.getTrainer() != null ? w.getTrainer().getFacultyId() : null)
                .build();
    }
}
