package com.hubblehox.e2j.service;

import com.hubblehox.e2j.entity.Course;
import com.hubblehox.e2j.entity.StudentProfile;
import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.repository.CourseRepository;
import com.hubblehox.e2j.repository.StudentProfileRepository;
import com.hubblehox.e2j.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseRecommendationService {

    private final CourseRepository courseRepo;
    private final StudentRepository studentRepo;
    private final StudentProfileRepository profileRepo;

    private static final int SKILL_WEIGHT = 2;
    private static final int ROLE_WEIGHT  = 3;

    public record ScoredCourse(Course course, int score, int matchPct) {}

    /**
     * Returns all courses scored by relevance to the student's profile.
     * Score = (skill matches × 2) + (role matches × 3).
     * Falls back to rating order when no profile/skills exist.
     */
    public List<ScoredCourse> getRecommended(User user) {
        // Load student skills + preferred job roles
        List<String> studentSkills = Collections.emptyList();
        List<String> preferredRoles = Collections.emptyList();

        var studentOpt = studentRepo.findByUser(user);
        if (studentOpt.isPresent()) {
            var profileOpt = profileRepo.findByStudent(studentOpt.get());
            if (profileOpt.isPresent()) {
                StudentProfile p = profileOpt.get();
                studentSkills = normalise(p.getSkills());
                preferredRoles = normalise(p.getPreferredJobRoles());
            }
        }

        final List<String> skills = studentSkills;
        final List<String> roles  = preferredRoles;
        final List<Course> all    = courseRepo.findAllByRatingDesc();

        // If no profile data at all, return all courses unscored
        if (skills.isEmpty() && roles.isEmpty()) {
            return all.stream()
                    .map(c -> new ScoredCourse(c, 0, 0))
                    .collect(Collectors.toList());
        }

        return all.stream()
                .map(c -> {
                    int skillMatches = countOverlap(normalise(c.getSkills()), skills);
                    int roleMatches  = countOverlap(normalise(c.getTargetRoles()), roles);
                    int score = skillMatches * SKILL_WEIGHT + roleMatches * ROLE_WEIGHT;

                    // match% relative to course's total tags
                    int total = c.getSkills().size() + c.getTargetRoles().size();
                    int matchPct = total > 0
                            ? Math.min(100, (skillMatches + roleMatches) * 100 / total)
                            : 0;

                    return new ScoredCourse(c, score, matchPct);
                })
                .sorted(Comparator
                        .comparingInt(ScoredCourse::score).reversed()
                        .thenComparingDouble(sc -> -sc.course().getRating()))
                .collect(Collectors.toList());
    }

    /** Returns only courses with score > 0, i.e., genuinely matched. */
    public List<ScoredCourse> getTopRecommended(User user) {
        var all = getRecommended(user);
        var matched = all.stream().filter(sc -> sc.score() > 0).collect(Collectors.toList());
        return matched.isEmpty() ? all : matched; // graceful fallback
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private List<String> normalise(List<String> list) {
        if (list == null) return Collections.emptyList();
        return list.stream()
                .map(s -> s.toLowerCase(Locale.ROOT).trim())
                .collect(Collectors.toList());
    }

    private int countOverlap(List<String> a, List<String> b) {
        if (a.isEmpty() || b.isEmpty()) return 0;
        // fuzzy: count a word in b as a match if b contains any word in the a item
        int count = 0;
        for (String ai : a) {
            String[] tokens = ai.split("[\\s,/&-]+");
            for (String token : tokens) {
                if (token.length() > 2 && b.stream().anyMatch(bi -> bi.contains(token))) {
                    count++;
                    break; // count the skill once even if multiple tokens match
                }
            }
        }
        return count;
    }
}
