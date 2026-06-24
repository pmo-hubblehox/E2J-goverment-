package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.entity.Course;
import com.hubblehox.e2j.entity.Student;
import com.hubblehox.e2j.entity.StudentAspiration;
import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.CourseRepository;
import com.hubblehox.e2j.repository.StudentAspirationRepository;
import com.hubblehox.e2j.repository.StudentRepository;
import com.hubblehox.e2j.service.CourseRecommendationService;
import com.hubblehox.e2j.service.InterviewService;
import com.hubblehox.e2j.service.YouTubeCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    private Student getStudent(User user) {
        return studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student profile not found", HttpStatus.NOT_FOUND));
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
