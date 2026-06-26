package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import com.hubblehox.e2j.service.CourseRecommendationService;
import com.hubblehox.e2j.service.InterviewService;
import com.hubblehox.e2j.service.YouTubeCourseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentRepository studentRepo;
    private final CourseRepository courseRepo;
    private final CourseRecommendationService recommendationService;
    private final YouTubeCourseService youTubeCourseService;
    private final InterviewService interviewService;
    private final StudentAspirationRepository aspirationRepo;
    private final JobApplicationRepository jobApplicationRepo;
    private final CurriculumRepository curriculumRepo;
    private final InstituteStudentRepository instituteStudentRepo;
    private final ObjectMapper objectMapper;

    private Student getStudent(User user) {
        return studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student profile not found", HttpStatus.NOT_FOUND));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard(@AuthenticationPrincipal User user) {
        Student student = getStudent(user);
        List<JobApplication> applications = jobApplicationRepo.findByStudentOrderByAppliedAtDesc(student);

        long jobsApplied        = applications.stream().filter(a -> a.getJobPosting() != null && a.getJobPosting().getPostingType() == JobPosting.PostingType.JOB).count();
        long internshipsApplied = applications.stream().filter(a -> a.getJobPosting() != null && a.getJobPosting().getPostingType() == JobPosting.PostingType.INTERNSHIP).count();
        long offered            = applications.stream().filter(a -> a.getStage() == JobApplication.Stage.OFFERED).count();
        long shortlisted        = applications.stream().filter(a -> a.getStage() == JobApplication.Stage.SHORTLISTED || a.getStage() == JobApplication.Stage.INTERVIEW_ROUND_1 || a.getStage() == JobApplication.Stage.INTERVIEW_ROUND_2).count();
        long interviewed        = applications.stream().filter(a -> a.getStage() == JobApplication.Stage.INTERVIEW_ROUND_1 || a.getStage() == JobApplication.Stage.INTERVIEW_ROUND_2).count();

        List<Map<String, Object>> recentApps = applications.stream().limit(5).map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("company", a.getJobPosting() != null && a.getJobPosting().getPartner() != null ? a.getJobPosting().getPartner().getRegisteredName() : "");
            m.put("role", a.getJobPosting() != null ? a.getJobPosting().getJobRole() : "");
            m.put("appliedAt", a.getAppliedAt() != null ? a.getAppliedAt().toLocalDate().toString() : "");
            m.put("stage", a.getStage() != null ? a.getStage().name() : "APPLIED");
            return m;
        }).collect(Collectors.toList());

        // Curriculum subjects from latest approved curriculum for student's institute
        List<Map<String, Object>> subjects = new ArrayList<>();
        try {
            // Find the student's institute record to get institute
            List<InstituteStudent> instStudents = instituteStudentRepo.findByEmailIgnoreCase(user.getEmail());
            if (!instStudents.isEmpty()) {
                Institute institute = instStudents.get(0).getInstitute();
                List<Curriculum> curricula = curriculumRepo.findLatestVersionPerProgram(institute);
                if (!curricula.isEmpty()) {
                    Curriculum latest = curricula.get(0);
                    if (latest.getCurriculumJson() != null) {
                        List<?> semesters = objectMapper.readValue(latest.getCurriculumJson(), List.class);
                        int subjectIndex = 0;
                        outer:
                        for (Object sem : semesters) {
                            Map<?, ?> semMap = (Map<?, ?>) sem;
                            List<?> subList = (List<?>) semMap.get("subjects");
                            if (subList == null) continue;
                            for (Object sub : subList) {
                                Map<?, ?> subMap = (Map<?, ?>) sub;
                                Map<String, Object> s = new LinkedHashMap<>();
                                s.put("code", subMap.get("code"));
                                s.put("name", subMap.get("name"));
                                s.put("credits", subMap.get("credits"));
                                s.put("semester", semMap.get("name"));
                                List<?> modules = (List<?>) subMap.get("modules");
                                int totalModules = modules != null ? modules.size() : 0;
                                s.put("totalModules", totalModules);
                                subjects.add(s);
                                subjectIndex++;
                                if (subjectIndex >= 6) break outer;
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {}

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("jobsApplied",        jobsApplied);
        data.put("internshipsApplied", internshipsApplied);
        data.put("offered",            offered);
        data.put("shortlisted",        shortlisted);
        data.put("interviewed",        interviewed);
        data.put("recentApplications", recentApps);
        data.put("placementFunnel",    List.of(
            Map.of("stage", "Applied",     "count", jobsApplied + internshipsApplied),
            Map.of("stage", "Shortlisted", "count", shortlisted),
            Map.of("stage", "Interviewed", "count", interviewed),
            Map.of("stage", "Offered",     "count", offered)
        ));
        data.put("curriculumSubjects", subjects);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Student>> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(getStudent(user)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Student>> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        Student s = getStudent(user);
        if (body.containsKey("phone")) s.setPhone((String) body.get("phone"));
        if (body.containsKey("city")) s.setCity((String) body.get("city"));
        if (body.containsKey("bio")) s.setBio((String) body.get("bio"));
        if (body.containsKey("linkedinUrl")) s.setLinkedinUrl((String) body.get("linkedinUrl"));
        if (body.containsKey("githubUrl")) s.setGithubUrl((String) body.get("githubUrl"));
        if (body.containsKey("portfolioUrl")) s.setPortfolioUrl((String) body.get("portfolioUrl"));
        if (body.containsKey("skills")) s.setSkills((List<String>) body.get("skills"));
        return ResponseEntity.ok(ApiResponse.ok(studentRepo.save(s)));
    }

    /** List all saved aspirations for this student */
    @GetMapping("/aspirations")
    public ResponseEntity<ApiResponse<List<StudentAspiration>>> getAspirations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(aspirationRepo.findByStudentOrderByCreatedAtDesc(getStudent(user))));
    }

    /** Save one aspiration (one role per wizard run) */
    @PostMapping("/aspiration")
    public ResponseEntity<ApiResponse<StudentAspiration>> saveAspiration(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> skills = body.containsKey("skills") ? (List<String>) body.get("skills") : List.of();
        StudentAspiration asp = StudentAspiration.builder()
                .student(getStudent(user))
                .goal(body.containsKey("goal") ? (String) body.get("goal") : null)
                .roleArea((String) body.get("roleArea"))
                .skills(skills)
                .build();
        return ResponseEntity.ok(ApiResponse.ok(aspirationRepo.save(asp), "Aspiration saved"));
    }

    /** Update aspiration roleArea (e.g. after psychometric report reveals top career match) */
    @PatchMapping("/aspiration/{id}")
    public ResponseEntity<ApiResponse<StudentAspiration>> updateAspiration(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        StudentAspiration asp = aspirationRepo.findByIdAndStudent(id, getStudent(user))
                .orElseThrow(() -> new AppException("Aspiration not found", HttpStatus.NOT_FOUND));
        if (body.containsKey("roleArea")) asp.setRoleArea((String) body.get("roleArea"));
        return ResponseEntity.ok(ApiResponse.ok(aspirationRepo.save(asp), "Updated"));
    }

    /** Delete an aspiration */
    @DeleteMapping("/aspirations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAspiration(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        StudentAspiration asp = aspirationRepo.findByIdAndStudent(id, getStudent(user))
                .orElseThrow(() -> new AppException("Aspiration not found", HttpStatus.NOT_FOUND));
        aspirationRepo.delete(asp);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    /** Keep for interview compatibility — returns all roles from saved aspirations */
    @GetMapping("/aspiration")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAspirationForInterview(@AuthenticationPrincipal User user) {
        var data = interviewService.getAspirationOptions(user.getEmail());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("roles", data.getRoles());
        result.put("skills", data.getSkills());
        result.put("experienceLevel", data.getExperienceLevel());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** AI role matches — used both in wizard and drill-down */
    @PostMapping("/aspiration/role-matches")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRoleMatches(
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) body.get("roles");
        @SuppressWarnings("unchecked")
        List<String> skills = body.containsKey("skills") ? (List<String>) body.get("skills") : List.of();
        return ResponseEntity.ok(ApiResponse.ok(interviewService.getRoleMatches(roles, skills)));
    }

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCourses(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "all") String tab) {

        if ("recommended".equals(tab)) {
            var scored = recommendationService.getTopRecommended(user);
            var result = scored.stream().map(sc -> courseToMap(sc.course(), sc.score(), sc.matchPct())).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.ok(result));
        }

        List<Course> courses = "institute".equals(tab)
                ? courseRepo.findByType(Course.CourseType.INSTITUTE)
                : courseRepo.findAllByRatingDesc();

        var result = courses.stream().map(c -> courseToMap(c, 0, 0)).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/courses/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyCourses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(List.of()));
    }

    // ── YouTube course recommendations ────────────────────────────────────

    @GetMapping("/courses/youtube/recommended")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getYouTubeRecommended(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(youTubeCourseService.getRecommendedVideos(user)));
    }

    @GetMapping("/courses/youtube/search")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> searchYouTube(
            @AuthenticationPrincipal User user,
            @RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.ok(youTubeCourseService.searchVideos(q)));
    }

    private Map<String, Object> courseToMap(Course c, int score, int matchPct) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("title", c.getTitle());
        m.put("instructor", c.getInstructor());
        m.put("rating", c.getRating());
        m.put("students", c.getStudentCount());
        m.put("duration", c.getDuration());
        m.put("price", c.getPrice());
        m.put("type", c.getType());
        m.put("category", c.getCategory());
        m.put("skills", c.getSkills());
        m.put("targetRoles", c.getTargetRoles());
        m.put("score", score);
        m.put("matchPct", matchPct);
        return m;
    }

    @PostMapping("/counselling/sessions")
    public ResponseEntity<ApiResponse<Void>> bookSession(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(null, "Session booked"));
    }
}
