package com.hubblehox.e2j.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PsychometricService {

    private final PsychometricQuestionRepository  questionRepo;
    private final PsychometricReportRepository    reportRepo;
    private final StudentEducationRepository      educationRepo;
    private final ObjectMapper                    objectMapper;

    private static final List<String> CATEGORIES = List.of("R", "I", "A", "S", "E", "C");
    private static final Map<String, String> CATEGORY_NAMES = Map.of(
        "R", "Realistic", "I", "Investigative", "A", "Artistic",
        "S", "Social",    "E", "Enterprising",  "C", "Conventional"
    );

    // Career path recommendations keyed by top-2 category combo (sorted)
    private static final Map<String, List<String>> PATH_MAP = new LinkedHashMap<>() {{
        put("E+I", List.of("Data Scientist", "AI/ML Engineer", "Product Manager", "Software Architect", "Technical Founder"));
        put("I+R", List.of("Backend Developer", "Software Engineer", "DevOps Engineer", "Data Analyst", "Cloud Engineer"));
        put("A+I", List.of("UI/UX Designer", "Frontend Developer", "Creative Technologist", "Game Developer", "Multimedia Engineer"));
        put("I+S", List.of("Data Analyst", "Business Analyst", "Research Scientist", "Education Technologist", "Healthcare Data Analyst"));
        put("C+I", List.of("Database Administrator", "Software Tester/QA Engineer", "Systems Analyst", "IT Auditor", "Compliance Analyst"));
        put("E+R", List.of("Technical Sales Engineer", "Startup Founder", "Product Owner", "Solutions Architect", "Engineering Manager"));
        put("E+S", List.of("Business Development Manager", "HR Tech Specialist", "Career Counsellor", "EdTech Entrepreneur", "Community Manager"));
        put("A+E", List.of("Creative Director", "Brand Strategist", "Marketing Technologist", "UX Strategist", "Growth Hacker"));
        put("C+E", List.of("Project Manager", "Operations Manager", "IT Manager", "Business Analyst", "Finance Technology Analyst"));
        put("A+S", List.of("Instructional Designer", "UX Researcher", "Content Strategist", "E-Learning Developer", "Training Consultant"));
        put("A+R", List.of("Game Developer", "Embedded Systems Designer", "Industrial Designer", "Hardware Engineer", "Creative Engineer"));
        put("C+S", List.of("IT Support Engineer", "Technical Trainer", "Customer Success Manager", "ERP Consultant", "Help Desk Manager"));
        put("C+R", List.of("Network Engineer", "IT Systems Administrator", "Cloud Support Associate", "Automation Engineer", "Security Analyst"));
        put("R+S", List.of("Technical Support Engineer", "Field Application Engineer", "IT Consultant", "Systems Integrator", "Technical Trainer"));
        put("A+C", List.of("Web Designer", "Digital Media Producer", "Front-End Developer", "Graphic Technologist", "Content Management Specialist"));
    }};

    // ── Determine profile type from student education ─────────────────────────

    public String detectProfileType(Student student) {
        try {
            List<StudentEducation> educations = educationRepo.findByStudentOrderByCreatedAtAsc(student);
            if (educations == null || educations.isEmpty()) return "GENERAL";
            String degree = educations.stream()
                .filter(e -> e.getDegree() != null)
                .map(e -> e.getDegree().toLowerCase())
                .findFirst().orElse("");

            if (degree.matches(".*(b\\.?tech|m\\.?tech|b\\.?e|m\\.?e|bca|mca|b\\.?sc.*comp|computer|software|information tech|it|cse|ece|eee|mechanical|civil|electrical).*"))
                return "TECH";
            if (degree.matches(".*(b\\.?com|m\\.?com|bba|mba|finance|accounting|economics|commerce|ca|chartered).*"))
                return "COMMERCE";
            if (degree.matches(".*(b\\.?a|b\\.?fa|m\\.?fa|arts|design|fine art|media|journalism|literature|history|psychology|sociology|language).*"))
                return "ARTS";
            return "GENERAL";
        } catch (Exception e) {
            return "GENERAL";
        }
    }

    // ── Get 30 adaptive questions (5 per RIASEC category) ────────────────────

    public List<Map<String, Object>> getQuestions(Student student) {
        String profileType = detectProfileType(student);
        List<PsychometricQuestion> pool = questionRepo.findByProfileType(profileType);

        // Group by category, pick up to 5 per category
        Map<String, List<PsychometricQuestion>> byCategory = pool.stream()
            .collect(Collectors.groupingBy(PsychometricQuestion::getCategory));

        List<PsychometricQuestion> selected = new ArrayList<>();
        for (String cat : CATEGORIES) {
            List<PsychometricQuestion> catQs = byCategory.getOrDefault(cat, List.of());
            // Prefer profileType-specific over GENERAL, then fill with GENERAL
            List<PsychometricQuestion> specific = catQs.stream()
                .filter(q -> !q.getProfileType().equals("GENERAL")).collect(Collectors.toList());
            List<PsychometricQuestion> general = catQs.stream()
                .filter(q -> q.getProfileType().equals("GENERAL")).collect(Collectors.toList());

            List<PsychometricQuestion> pick = new ArrayList<>();
            pick.addAll(specific.stream().limit(5).toList());
            if (pick.size() < 5) pick.addAll(general.stream().limit(5 - pick.size()).toList());
            selected.addAll(pick);
        }

        // Shuffle within each category block but keep category order
        List<Map<String, Object>> result = new ArrayList<>();
        int idx = 1;
        for (PsychometricQuestion q : selected) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", q.getId());
            m.put("questionNumber", idx++);
            m.put("questionText", q.getQuestionText());
            m.put("category", q.getCategory());
            m.put("categoryName", CATEGORY_NAMES.get(q.getCategory()));
            result.add(m);
        }
        return result;
    }

    // ── Score submitted answers and save report ───────────────────────────────

    public PsychometricReport submitAndScore(Student student, Map<Long, Integer> answers, Long aspirationId) {
        List<PsychometricQuestion> questions = questionRepo.findAllById(answers.keySet());

        // Sum scores per category
        Map<String, Integer> scores = new LinkedHashMap<>();
        for (String c : CATEGORIES) scores.put(c, 0);
        for (PsychometricQuestion q : questions) {
            int val = answers.getOrDefault(q.getId(), 0);
            val = Math.max(1, Math.min(5, val)); // clamp 1-5
            scores.merge(q.getCategory(), val, Integer::sum);
        }

        // Find top 2 categories
        List<String> sorted = scores.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());

        String top1 = sorted.get(0);
        String top2 = sorted.size() > 1 ? sorted.get(1) : top1;
        String comboKey = buildComboKey(top1, top2);

        List<String> paths = PATH_MAP.getOrDefault(comboKey,
            PATH_MAP.getOrDefault(buildComboKey(top1, sorted.size() > 2 ? sorted.get(2) : top1),
                List.of("Software Engineer", "Data Analyst", "Business Analyst", "Product Manager", "IT Consultant")));

        int total = scores.values().stream().mapToInt(Integer::intValue).sum();
        String topInterests = CATEGORY_NAMES.get(top1) + ", " + CATEGORY_NAMES.get(top2);

        String scoresJson, pathsJson;
        try {
            scoresJson = objectMapper.writeValueAsString(scores);
            pathsJson  = objectMapper.writeValueAsString(paths);
        } catch (Exception e) {
            scoresJson = "{}"; pathsJson = "[]";
        }

        PsychometricReport report = PsychometricReport.builder()
            .student(student)
            .aspirationId(aspirationId)
            .scoresJson(scoresJson)
            .recommendedPathsJson(pathsJson)
            .topInterests(topInterests)
            .topCareerMatch(paths.isEmpty() ? null : paths.get(0))
            .totalScore(total)
            .build();

        return reportRepo.save(report);
    }

    private String buildComboKey(String a, String b) {
        return a.compareTo(b) <= 0 ? a + "+" + b : b + "+" + a;
    }

    // ── Bulk upload questions from Excel ──────────────────────────────────────

    public int bulkUploadQuestions(MultipartFile file) throws IOException {
        int count = 0;
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String text        = str(row.getCell(0));
                String category    = str(row.getCell(1)).toUpperCase().trim();
                String profileType = str(row.getCell(2)).toUpperCase().trim();
                String orderStr    = str(row.getCell(3));

                if (text.isBlank() || !CATEGORIES.contains(category)) continue;
                if (!List.of("TECH","ARTS","COMMERCE","GENERAL").contains(profileType)) profileType = "GENERAL";

                Integer order = null;
                try { order = Integer.parseInt(orderStr); } catch (Exception ignored) {}

                PsychometricQuestion q = PsychometricQuestion.builder()
                    .questionText(text)
                    .category(category)
                    .profileType(profileType)
                    .orderIndex(order)
                    .active(true)
                    .build();
                questionRepo.save(q);
                count++;
            }
        }
        return count;
    }

    // ── Generate sample Excel for verifier download ───────────────────────────

    public byte[] generateSampleExcel() throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XSSFSheet sheet = wb.createSheet("Questions");

            // Header row
            XSSFRow header = sheet.createRow(0);
            String[] cols = {"questionText", "category (R/I/A/S/E/C)", "profileType (TECH/ARTS/COMMERCE/GENERAL)", "orderIndex"};
            for (int i = 0; i < cols.length; i++) {
                XSSFCell cell = header.createCell(i);
                cell.setCellValue(cols[i]);
            }

            // Sample rows
            Object[][] samples = {
                {"I enjoy working with tools, machines, or physical objects.", "R", "TECH", 1},
                {"I like analysing data and writing code to solve problems.", "I", "TECH", 2},
                {"I enjoy designing user interfaces and visual layouts.", "A", "TECH", 3},
                {"I like helping others learn new technical concepts.", "S", "TECH", 4},
                {"I enjoy leading technical projects and making strategic decisions.", "E", "TECH", 5},
                {"I prefer following established processes and standards in my work.", "C", "TECH", 6},
                {"I enjoy working with numbers, budgets, and financial reports.", "C", "COMMERCE", 1},
                {"I like creating artwork, music, or creative writing.", "A", "ARTS", 1},
            };
            int rowIdx = 1;
            for (Object[] row : samples) {
                XSSFRow r = sheet.createRow(rowIdx++);
                for (int i = 0; i < row.length; i++) {
                    XSSFCell c = r.createCell(i);
                    if (row[i] instanceof Integer) c.setCellValue((Integer) row[i]);
                    else c.setCellValue(row[i].toString());
                }
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        }
    }

    private String str(Cell c) {
        if (c == null) return "";
        return switch (c.getCellType()) {
            case STRING  -> c.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) c.getNumericCellValue());
            default      -> "";
        };
    }

    // ── Report to map (for API response) ──────────────────────────────────────

    public Map<String, Object> reportToMap(PsychometricReport r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("aspirationId", r.getAspirationId());
        m.put("topInterests", r.getTopInterests());
        m.put("topCareerMatch", r.getTopCareerMatch());
        m.put("totalScore", r.getTotalScore());
        m.put("createdAt", r.getCreatedAt());
        m.put("counsellorComment", r.getCounsellorComment());
        m.put("counsellorName", r.getCounsellorName());
        m.put("commentedAt", r.getCommentedAt());
        try {
            m.put("scores", objectMapper.readValue(r.getScoresJson(), Map.class));
            m.put("recommendedPaths", objectMapper.readValue(r.getRecommendedPathsJson(), List.class));
        } catch (Exception e) {
            m.put("scores", Map.of());
            m.put("recommendedPaths", List.of());
        }
        return m;
    }
}
