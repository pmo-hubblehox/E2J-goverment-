package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import com.hubblehox.e2j.dto.IndustryCampusInviteDto;
import com.hubblehox.e2j.service.ExcelService;
import com.hubblehox.e2j.service.GroqService;
import com.hubblehox.e2j.service.IndustryCampusInviteService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/institute")
@RequiredArgsConstructor
public class InstituteController {

    private final InstituteRepository            instituteRepo;
    private final ProgramRepository              programRepo;
    private final FacultyRepository              facultyRepo;
    private final VenueBookingRepository         venueRepo;
    private final VenueAvailabilityRepository    availabilityRepo;
    private final CampusRecruitmentRepository    recruitmentRepo;
    private final CurriculumRepository           curriculumRepo;
    private final InstituteStudentRepository     studentRepo;
    private final ExcelService                   excelService;
    private final GroqService                    groqService;
    private final ObjectMapper                   objectMapper;
    private final BosMemberRepository            bosMemberRepo;
    private final UserRepository                 userRepo;
    private final CurriculumApprovalRepository   approvalRepo;
    private final PasswordEncoder                passwordEncoder;
    private final IndustryCampusInviteService    campusInviteService;
    private final InstituteInfraRepository       infraRepo;
    private final InstituteRoomRepository        roomRepo;
    private final InstituteLabRepository         labRepo;
    private final com.hubblehox.e2j.service.WorkshopPostingService workshopPostingService;
    private final com.hubblehox.e2j.service.WorkshopEnrollmentService workshopEnrollmentService;
    private final com.hubblehox.e2j.service.WorkshopReviewService workshopReviewService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    // ── Auth helper ───────────────────────────────────────────────────────────

    private Institute getInstitute(User user) {
        return instituteRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Institute profile not found", HttpStatus.NOT_FOUND));
    }

    private static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // ── Profile ───────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Institute>> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(getInstitute(user)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Institute>> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        Institute inst = getInstitute(user);
        if (body.containsKey("name"))    inst.setName(body.get("name"));
        if (body.containsKey("website")) inst.setWebsiteUrl(body.get("website"));
        if (body.containsKey("phone"))   inst.setPhone(body.get("phone"));
        if (body.containsKey("city"))    inst.setCity(body.get("city"));
        if (body.containsKey("state"))   inst.setState(body.get("state"));
        if (body.containsKey("pincode")) inst.setPincode(body.get("pincode"));
        if (body.containsKey("address")) inst.setAddress(body.get("address"));
        return ResponseEntity.ok(ApiResponse.ok(instituteRepo.save(inst)));
    }

    // ── Dashboard Analytics ───────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard(
            @AuthenticationPrincipal User user) {
        Institute inst = getInstitute(user);
        long totalPrograms = programRepo.findByInstitute(inst, PageRequest.of(0, 1)).getTotalElements();
        long totalFaculty  = facultyRepo.findByInstitute(inst, PageRequest.of(0, 1)).getTotalElements();
        long totalStudents = studentRepo.countByInstitute(inst);
        long totalDrives   = recruitmentRepo.findByInstitute(inst, PageRequest.of(0, 1)).getTotalElements();
        long accepted      = recruitmentRepo.findByInstituteAndStatus(inst, CampusRecruitment.Status.ACCEPTED, PageRequest.of(0, 1)).getTotalElements();
        long received      = recruitmentRepo.findByInstituteAndStatus(inst, CampusRecruitment.Status.RECEIVED, PageRequest.of(0, 1)).getTotalElements();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalPrograms",   totalPrograms);
        data.put("totalFaculty",    totalFaculty);
        data.put("totalStudents",   totalStudents);
        data.put("totalDrives",     totalDrives);
        data.put("acceptedDrives",  accepted);
        data.put("receivedDrives",  received);
        data.put("placementFunnel", List.of(
            Map.of("stage", "Applied",     "count", totalStudents),
            Map.of("stage", "Shortlisted", "count", (long)(totalStudents * 0.60)),
            Map.of("stage", "Interviewed", "count", (long)(totalStudents * 0.35)),
            Map.of("stage", "Offered",     "count", (long)(totalStudents * 0.20)),
            Map.of("stage", "Joined",      "count", (long)(totalStudents * 0.15))
        ));
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReports(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "PLACEMENT") String type) {
        Institute inst = getInstitute(user);
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("type",          type);
        report.put("generatedAt",   LocalDate.now().toString());
        report.put("instituteName", inst.getName());
        report.put("summary", switch (type.toUpperCase()) {
            case "FACULTY"   -> Map.of(
                "total", facultyRepo.findByInstitute(inst, PageRequest.of(0, 1)).getTotalElements());
            case "INFRA"     -> Map.of("classrooms", 12, "labs", 8, "seminarHalls", 3);
            case "SKILL_GAP" -> Map.of(
                "studentsAssessed",   studentRepo.countByInstitute(inst),
                "skillGapIdentified", (long)(studentRepo.countByInstitute(inst) * 0.4));
            default          -> Map.of(
                "totalDrives",   recruitmentRepo.findByInstitute(inst, PageRequest.of(0, 1)).getTotalElements(),
                "placed",        120,
                "placementRate", "78%");
        });
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    // ── Programs ──────────────────────────────────────────────────────────────

    @GetMapping("/programs")
    public ResponseEntity<ApiResponse<Page<Program>>> getPrograms(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                programRepo.findByInstitute(getInstitute(user), PageRequest.of(page, size))));
    }

    @GetMapping("/programs/{id}")
    public ResponseEntity<ApiResponse<Program>> getProgram(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        Institute inst = getInstitute(user);
        Program p = programRepo.findByIdAndInstitute(id, inst)
                .orElseThrow(() -> new AppException("Program not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(p));
    }

    @PostMapping("/programs")
    public ResponseEntity<ApiResponse<Program>> addProgram(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        String degree = (String) body.get("degree");
        Program p = Program.builder()
                .institute(getInstitute(user))
                .degree(degree)
                .name((String) body.get("name"))
                .majors(toStringList(body.get("majors")))
                .duration(toInt(body.get("duration"), 4))
                .totalFees(toDouble(body.get("totalFees"), 0))
                .intakeCapacity(toInt(body.get("intakeCapacity"), 0))
                .deadline(parseDate(body.get("deadline")))
                .status(body.containsKey("status") ? Program.Status.valueOf((String) body.get("status")) : Program.Status.DRAFT)
                .build();
        Program saved = programRepo.save(p);
        // auto-generate programId after DB assigns the id
        String cat = List.of("B.Tech", "BBA", "B.Sc", "Diploma").contains(saved.getDegree()) ? "UG" : "PG";
        saved.setProgramId(cat + "-" + String.format("%04d", saved.getId()));
        return ResponseEntity.ok(ApiResponse.ok(programRepo.save(saved), "Program added"));
    }

    @PutMapping("/programs/{id}")
    public ResponseEntity<ApiResponse<Program>> updateProgram(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Institute inst = getInstitute(user);
        Program p = programRepo.findByIdAndInstitute(id, inst)
                .orElseThrow(() -> new AppException("Program not found", HttpStatus.NOT_FOUND));
        if (body.containsKey("degree"))         p.setDegree((String) body.get("degree"));
        if (body.containsKey("name"))           p.setName((String) body.get("name"));
        if (body.containsKey("duration"))       p.setDuration(toInt(body.get("duration"), p.getDuration()));
        if (body.containsKey("intakeCapacity")) p.setIntakeCapacity(toInt(body.get("intakeCapacity"), p.getIntakeCapacity()));
        if (body.containsKey("totalFees"))      p.setTotalFees(toDouble(body.get("totalFees"), p.getTotalFees()));
        if (body.containsKey("majors"))         p.setMajors(toStringList(body.get("majors")));
        if (body.containsKey("deadline"))       p.setDeadline(parseDate(body.get("deadline")));
        if (body.containsKey("status"))         p.setStatus(Program.Status.valueOf((String) body.get("status")));
        return ResponseEntity.ok(ApiResponse.ok(programRepo.save(p), "Updated"));
    }

    @DeleteMapping("/programs/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProgram(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Institute inst = getInstitute(user);
        Program p = programRepo.findById(id)
                .filter(pr -> pr.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Program not found", HttpStatus.NOT_FOUND));
        programRepo.delete(p);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    @PostMapping("/programs/{id}/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProgramDoc(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("docType") String docType) throws java.io.IOException {

        Institute inst = getInstitute(user);
        Program p = programRepo.findById(id)
                .filter(pr -> pr.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Program not found", HttpStatus.NOT_FOUND));

        String safe = docType.trim().replaceAll("[^a-zA-Z0-9_\\-]", "");
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        java.nio.file.Path dir = java.nio.file.Paths.get(uploadDir, "institute", "programs", String.valueOf(id), safe);
        java.nio.file.Files.createDirectories(dir);
        java.nio.file.Files.copy(file.getInputStream(), dir.resolve(name), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        String url = "/api/files/institute/programs/" + id + "/" + safe + "/" + name;

        if ("syllabus".equals(safe))         p.setSyllabusUrl(url);
        else if ("credit".equals(safe))      p.setCreditStructureUrl(url);
        else if ("calendar".equals(safe))    p.setCalendarUrl(url);

        programRepo.save(p);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", url), "Uploaded"));
    }

    @PostMapping("/programs/bulk")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkUploadPrograms(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {
        int count = excelService.bulkUploadPrograms(file, getInstitute(user));
        return ResponseEntity.ok(ApiResponse.ok(Map.of("uploaded", count), count + " programs uploaded"));
    }

    @GetMapping("/programs/sample")
    public ResponseEntity<byte[]> downloadProgramSample() throws IOException {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Sample_Programs.xlsx")
                .contentType(XLSX).body(excelService.sampleProgramsExcel());
    }

    @GetMapping("/programs/sample/credit-structure")
    public ResponseEntity<byte[]> downloadCreditSample() throws IOException {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Sample_Credit_Structure.xlsx")
                .contentType(XLSX).body(excelService.sampleCreditStructureExcel());
    }

    @GetMapping("/programs/sample/syllabus")
    public ResponseEntity<byte[]> downloadSyllabusSample() throws IOException {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Sample_Syllabus.xlsx")
                .contentType(XLSX).body(excelService.sampleSyllabusExcel());
    }

    // ── Curriculum ────────────────────────────────────────────────────────────

    /** Returns only the latest version per program (one row per programId). */
    @GetMapping("/curriculum")
    public ResponseEntity<ApiResponse<List<Curriculum>>> getCurriculum(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                curriculumRepo.findLatestVersionPerProgram(getInstitute(user))));
    }

    /** Returns a single curriculum entry by id (includes curriculumJson). */
    @GetMapping("/curriculum/entry/{id}")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getCurriculumEntry(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return curriculumRepo.findById(id)
                .filter(c -> c.getInstitute().getId().equals(getInstitute(user).getId()))
                .map(c -> {
                    java.util.Map<String, Object> data = new java.util.HashMap<>();
                    data.put("id",             c.getId());
                    data.put("curriculumJson", c.getCurriculumJson() != null ? c.getCurriculumJson() : "");
                    data.put("status",         c.getStatus() != null ? c.getStatus().name() : "");
                    data.put("approvalType",   c.getApprovalType() != null ? c.getApprovalType() : "");
                    return ResponseEntity.ok(ApiResponse.ok(data));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Returns all versions for a given programId, newest first. */
    @GetMapping("/curriculum/versions/{programId}")
    public ResponseEntity<ApiResponse<List<Curriculum>>> getCurriculumVersions(
            @AuthenticationPrincipal User user,
            @PathVariable Long programId) {
        return ResponseEntity.ok(ApiResponse.ok(
                curriculumRepo.findAllVersionsByProgramId(getInstitute(user), programId)));
    }

    /**
     * Creates a v1 "Yet To Start" entry.
     * Skips silently if one already exists for this programId — safe to call multiple times.
     */
    @PostMapping("/curriculum")
    public ResponseEntity<ApiResponse<Curriculum>> addCurriculum(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        Institute inst = getInstitute(user);
        Object pidRaw = body.get("programId");
        Long programId = pidRaw != null ? ((Number) pidRaw).longValue() : null;

        String major = (String) body.get("major");

        // Dedup by programId + major — safe to call multiple times (e.g. clicking Done again)
        if (programId != null && major != null &&
                curriculumRepo.existsByInstituteAndProgramIdAndMajor(inst, programId, major)) {
            Curriculum existing = curriculumRepo
                    .findTopByInstituteAndProgramIdAndMajorOrderByVersionDesc(inst, programId, major)
                    .orElseThrow();
            return ResponseEntity.ok(ApiResponse.ok(existing, "Curriculum already exists"));
        }

        Object durRaw = body.get("duration");
        Integer duration = durRaw != null ? ((Number) durRaw).intValue() : null;
        int year = LocalDate.now().getYear();
        String defaultYear = year + "-" + String.format("%02d", (year + 1) % 100);

        Curriculum c = Curriculum.builder()
                .institute(inst)
                .programId(programId)
                .programName((String) body.get("programName"))
                .academicYear(body.getOrDefault("academicYear", defaultYear).toString())
                .degree((String) body.get("degree"))
                .major(major)
                .duration(duration)
                .version(1)
                .status(Curriculum.Status.YET_TO_START)
                .build();
        return ResponseEntity.ok(ApiResponse.ok(curriculumRepo.save(c), "Curriculum created"));
    }

    @PutMapping("/curriculum/{id}")
    public ResponseEntity<ApiResponse<Curriculum>> updateCurriculum(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Institute inst = getInstitute(user);
        Curriculum c = curriculumRepo.findById(id)
                .filter(cu -> cu.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Curriculum not found", HttpStatus.NOT_FOUND));
        if (body.containsKey("status"))         c.setStatus(Curriculum.Status.valueOf((String) body.get("status")));
        if (body.containsKey("curriculumJson")) c.setCurriculumJson((String) body.get("curriculumJson"));
        if (body.containsKey("academicYear"))   c.setAcademicYear((String) body.get("academicYear"));
        return ResponseEntity.ok(ApiResponse.ok(curriculumRepo.save(c), "Updated"));
    }

    /** Send curriculum for BOS approval — creates one CurriculumApproval row per BOS member */
    @PostMapping("/curriculum/{id}/send-for-approval")
    public ResponseEntity<ApiResponse<Curriculum>> sendForApproval(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        Institute inst = getInstitute(user);
        Curriculum c = curriculumRepo.findById(id)
                .filter(cu -> cu.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Curriculum not found", HttpStatus.NOT_FOUND));

        c.setStatus(Curriculum.Status.SENT_FOR_BOS_APPROVAL);
        if (body != null && body.containsKey("approvalType")) {
            c.setApprovalType(body.get("approvalType"));
        }
        curriculumRepo.save(c);

        List<BosMember> members = bosMemberRepo.findByInstitute(inst);
        for (BosMember bm : members) {
            User bosUser = bm.getEmail() != null ? userRepo.findByEmail(bm.getEmail()).orElse(null) : null;
            boolean alreadyExists = bosUser != null && approvalRepo.existsByCurriculumAndBosUser(c, bosUser);
            if (!alreadyExists) {
                approvalRepo.save(CurriculumApproval.builder()
                        .curriculum(c)
                        .bosMember(bm)
                        .bosUser(bosUser)
                        .build());
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(c, "Sent for BOS approval"));
    }

    @DeleteMapping("/curriculum/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCurriculum(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Institute inst = getInstitute(user);
        Curriculum c = curriculumRepo.findById(id)
                .filter(cu -> cu.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Curriculum not found", HttpStatus.NOT_FOUND));
        approvalRepo.deleteAll(approvalRepo.findByCurriculum(c));
        curriculumRepo.delete(c);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    @PostMapping("/programs/{id}/generate-curriculum")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateCurriculum(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) throws Exception {

        Institute inst = getInstitute(user);
        Program program = programRepo.findById(id)
                .filter(p -> p.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Program not found", HttpStatus.NOT_FOUND));

        String syllabusJson = objectMapper.writeValueAsString(body.get("semesters"));

        // The caller can pass the specific major they're generating AI for; fall back to first major
        String major = body.containsKey("major") ? (String) body.get("major")
                : (program.getMajors() != null && !program.getMajors().isEmpty() ? program.getMajors().get(0) : "");

        // Fetch top 5 trending job roles for this program, then generate curriculum targeting them
        List<String> jobRoles = groqService.fetchTopJobRoles(
                program.getName(), major, program.getDegree(), 5);
        String aiJson = groqService.generateEnhancedCurriculum(syllabusJson, jobRoles);

        @SuppressWarnings("unchecked")
        Map<String, Object> result = objectMapper.readValue(aiJson, Map.class);
        int year = LocalDate.now().getYear();
        String academicYear = year + "-" + String.format("%02d", (year + 1) % 100);

        // Increment version per (programId, major) track
        int nextVersion = curriculumRepo
                .findTopByInstituteAndProgramIdAndMajorOrderByVersionDesc(inst, id, major)
                .map(c -> c.getVersion() + 1)
                .orElse(1);

        Curriculum curriculum = Curriculum.builder()
                .institute(inst)
                .programId(id)
                .programName(program.getName())
                .degree(program.getDegree())
                .major(major)
                .duration(program.getDuration())
                .academicYear(academicYear)
                .curriculumJson(aiJson)
                .version(nextVersion)
                .status(Curriculum.Status.AI_COMPLETED)
                .build();
        Curriculum saved = curriculumRepo.save(curriculum);

        result.put("curriculumId", saved.getId());
        result.put("version", saved.getVersion());
        return ResponseEntity.ok(ApiResponse.ok(result, "AI curriculum generated (v" + nextVersion + ")"));
    }

    // ── Faculty ───────────────────────────────────────────────────────────────

    @GetMapping("/faculty")
    public ResponseEntity<ApiResponse<Page<Faculty>>> getFaculty(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                facultyRepo.findByInstitute(getInstitute(user), PageRequest.of(page, size))));
    }

    @PostMapping("/faculty")
    public ResponseEntity<ApiResponse<Faculty>> addFaculty(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        Faculty f = Faculty.builder()
                .institute(getInstitute(user))
                .name((String) body.get("name"))
                .email((String) body.get("email"))
                .expertise(toStringList(body.get("expertise")))
                .days(toStringList(body.get("days")))
                .mode((String) body.get("mode"))
                .bio((String) body.get("bio"))
                .status(Faculty.Status.AVAILABLE)
                .build();
        return ResponseEntity.ok(ApiResponse.ok(facultyRepo.save(f), "Faculty added"));
    }

    @PutMapping("/faculty/{id}")
    public ResponseEntity<ApiResponse<Faculty>> updateFaculty(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Institute inst = getInstitute(user);
        Faculty f = facultyRepo.findById(id)
                .filter(fc -> fc.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Faculty not found", HttpStatus.NOT_FOUND));
        if (body.containsKey("name"))      f.setName((String) body.get("name"));
        if (body.containsKey("email"))     f.setEmail((String) body.get("email"));
        if (body.containsKey("mode"))      f.setMode((String) body.get("mode"));
        if (body.containsKey("bio"))       f.setBio((String) body.get("bio"));
        if (body.containsKey("expertise")) f.setExpertise(toStringList(body.get("expertise")));
        if (body.containsKey("days"))      f.setDays(toStringList(body.get("days")));
        if (body.containsKey("status"))    f.setStatus(Faculty.Status.valueOf((String) body.get("status")));
        return ResponseEntity.ok(ApiResponse.ok(facultyRepo.save(f), "Updated"));
    }

    @DeleteMapping("/faculty/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFaculty(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Institute inst = getInstitute(user);
        Faculty f = facultyRepo.findById(id)
                .filter(fc -> fc.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Faculty not found", HttpStatus.NOT_FOUND));
        facultyRepo.delete(f);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    @PostMapping("/faculty/bulk")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkUploadFaculty(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {
        int count = excelService.bulkUploadFaculty(file, getInstitute(user));
        return ResponseEntity.ok(ApiResponse.ok(Map.of("uploaded", count), count + " faculty uploaded"));
    }

    @GetMapping("/faculty/sample")
    public ResponseEntity<byte[]> downloadFacultySample() throws IOException {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Sample_Faculty.xlsx")
                .contentType(XLSX).body(excelService.sampleFacultyExcel());
    }

    // ── Students ──────────────────────────────────────────────────────────────

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<Page<InstituteStudent>>> getStudents(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                studentRepo.findByInstitute(getInstitute(user), PageRequest.of(page, size))));
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Institute inst = getInstitute(user);
        InstituteStudent s = studentRepo.findById(id)
                .filter(st -> st.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
        studentRepo.delete(s);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    @PostMapping("/students")
    public ResponseEntity<ApiResponse<InstituteStudent>> addStudent(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        Institute inst = getInstitute(user);
        String email        = (String) body.getOrDefault("email", "");
        String name         = (String) body.getOrDefault("name", "");
        String phone        = (String) body.getOrDefault("phone", "");
        String degree       = (String) body.getOrDefault("degree", "");
        String school       = (String) body.getOrDefault("schoolUniversity", "");
        String major        = (String) body.getOrDefault("major", "");
        String yearOfPassing= (String) body.getOrDefault("yearOfPassing", "");
        String cgpaStr      = body.containsKey("cgpa") ? String.valueOf(body.get("cgpa")) : "";
        double cgpa = 0;
        try { cgpa = Double.parseDouble(cgpaStr); } catch (Exception ignored) {}

        InstituteStudent s = InstituteStudent.builder()
                .institute(inst)
                .studentId((String) body.getOrDefault("studentId", ""))
                .name(name).email(email).phone(phone)
                .degree(degree).schoolUniversity(school).major(major)
                .yearOfPassing(yearOfPassing).cgpa(cgpa > 0 ? cgpa : null)
                .status(InstituteStudent.Status.ACTIVE)
                .build();
        studentRepo.save(s);
        excelService.provisionStudentAccount(email, name, phone, degree, school, major, yearOfPassing, cgpaStr);
        return ResponseEntity.ok(ApiResponse.ok(s, "Student added"));
    }

    @PostMapping("/students/bulk")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkUploadStudents(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {
        int count = excelService.bulkUploadStudents(file, getInstitute(user));
        return ResponseEntity.ok(ApiResponse.ok(Map.of("uploaded", count), count + " students uploaded"));
    }

    @GetMapping("/students/sample")
    public ResponseEntity<byte[]> downloadStudentSample() throws IOException {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Sample_Students.xlsx")
                .contentType(XLSX).body(excelService.sampleStudentsExcel());
    }

    // ── Venues — Bookings ─────────────────────────────────────────────────────

    @GetMapping("/venues/bookings")
    public ResponseEntity<ApiResponse<Page<VenueBooking>>> getBookings(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                venueRepo.findByInstitute(getInstitute(user), PageRequest.of(page, size))));
    }

    // ── Venues — Availability ─────────────────────────────────────────────────

    @GetMapping("/venues/availability")
    public ResponseEntity<ApiResponse<Page<VenueAvailability>>> getAvailability(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                availabilityRepo.findByInstitute(getInstitute(user), PageRequest.of(page, size))));
    }

    @PostMapping("/venues/availability")
    public ResponseEntity<ApiResponse<VenueAvailability>> addAvailability(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        VenueAvailability va = VenueAvailability.builder()
                .institute(getInstitute(user))
                .roomType((String) body.get("roomType"))
                .roomNo((String) body.getOrDefault("roomNo", ""))
                .dateFrom(parseDate(body.get("dateFrom")))
                .dateTo(parseDate(body.get("dateTo")))
                .timeFrom(parseTime(body.get("timeFrom")))
                .timeTo(parseTime(body.get("timeTo")))
                .computersOffered(body.containsKey("computersOffered") ? toInt(body.get("computersOffered"), 0) : null)
                .buffersOffered(body.containsKey("buffersOffered") ? toInt(body.get("buffersOffered"), 0) : null)
                .totalOffered(body.containsKey("totalOffered") ? toInt(body.get("totalOffered"), 0) : null)
                .build();
        return ResponseEntity.ok(ApiResponse.ok(availabilityRepo.save(va), "Availability saved"));
    }

    @PutMapping("/venues/availability/{id}")
    public ResponseEntity<ApiResponse<VenueAvailability>> updateAvailability(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Institute inst = getInstitute(user);
        VenueAvailability va = availabilityRepo.findById(id)
                .filter(v -> v.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        if (body.containsKey("roomType"))         va.setRoomType((String) body.get("roomType"));
        if (body.containsKey("roomNo"))           va.setRoomNo((String) body.get("roomNo"));
        if (body.containsKey("dateFrom"))         va.setDateFrom(parseDate(body.get("dateFrom")));
        if (body.containsKey("dateTo"))           va.setDateTo(parseDate(body.get("dateTo")));
        if (body.containsKey("timeFrom"))         va.setTimeFrom(parseTime(body.get("timeFrom")));
        if (body.containsKey("timeTo"))           va.setTimeTo(parseTime(body.get("timeTo")));
        if (body.containsKey("computersOffered")) va.setComputersOffered(toInt(body.get("computersOffered"), 0));
        if (body.containsKey("buffersOffered"))   va.setBuffersOffered(toInt(body.get("buffersOffered"), 0));
        if (body.containsKey("totalOffered"))     va.setTotalOffered(toInt(body.get("totalOffered"), 0));
        return ResponseEntity.ok(ApiResponse.ok(availabilityRepo.save(va), "Updated"));
    }

    @DeleteMapping("/venues/availability/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAvailability(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Institute inst = getInstitute(user);
        VenueAvailability va = availabilityRepo.findById(id)
                .filter(v -> v.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        availabilityRepo.delete(va);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    // ── Campus Recruitment ────────────────────────────────────────────────────

    @GetMapping("/recruitment")
    public ResponseEntity<ApiResponse<Page<CampusRecruitment>>> getRecruitments(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        Institute inst = getInstitute(user);
        Page<CampusRecruitment> result = status != null
                ? recruitmentRepo.findByInstituteAndStatus(inst,
                    CampusRecruitment.Status.valueOf(status.toUpperCase()), PageRequest.of(page, size))
                : recruitmentRepo.findByInstitute(inst, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/recruitment/{id}")
    public ResponseEntity<ApiResponse<CampusRecruitment>> getRecruitment(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Institute inst = getInstitute(user);
        CampusRecruitment r = recruitmentRepo.findById(id)
                .filter(rc -> rc.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(r));
    }

    @PostMapping("/recruitment/invite")
    public ResponseEntity<ApiResponse<CampusRecruitment>> sendInvite(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        CampusRecruitment r = CampusRecruitment.builder()
                .institute(getInstitute(user))
                .industryPartner((String) body.getOrDefault("industryPartner", ""))
                .driveName((String) body.getOrDefault("driveName", "Drive " + LocalDate.now()))
                .jobRole((String) body.getOrDefault("jobRole", ""))
                .programName(body.get("programNames") instanceof List<?> l
                        ? String.join(", ", l.stream().map(Object::toString).toList()) : "")
                .specialization(body.get("areaOfSpec") instanceof List<?> l
                        ? String.join(", ", l.stream().map(Object::toString).toList()) : "")
                .eligibility((String) body.getOrDefault("eligibility", ""))
                .packageOffered((String) body.getOrDefault("packageOffered", ""))
                .driveDate(parseDate(body.get("driveDate")))
                .status(CampusRecruitment.Status.INVITED)
                .build();
        return ResponseEntity.ok(ApiResponse.ok(recruitmentRepo.save(r), "Invite sent"));
    }

    @PutMapping("/recruitment/{id}/status")
    public ResponseEntity<ApiResponse<CampusRecruitment>> updateRecruitmentStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Institute inst = getInstitute(user);
        CampusRecruitment r = recruitmentRepo.findById(id)
                .filter(rc -> rc.getInstitute().getId().equals(inst.getId()))
                .orElseThrow(() -> new AppException("Not found", HttpStatus.NOT_FOUND));
        r.setStatus(CampusRecruitment.Status.valueOf(body.get("status").toUpperCase()));
        return ResponseEntity.ok(ApiResponse.ok(recruitmentRepo.save(r), "Status updated"));
    }

    // ── Industry Campus Invites (received by institute) ───────────────────────

    @GetMapping("/campus-invites")
    public ResponseEntity<ApiResponse<List<IndustryCampusInviteDto.Response>>> getCampusInvites(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String status) {
        Institute inst = getInstitute(user);
        return ResponseEntity.ok(ApiResponse.ok(campusInviteService.listForInstitute(inst, status)));
    }

    @PatchMapping("/campus-invites/{id}/status")
    public ResponseEntity<ApiResponse<IndustryCampusInviteDto.Response>> updateCampusInviteStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Institute inst = getInstitute(user);
        return ResponseEntity.ok(ApiResponse.ok(
                campusInviteService.updateStatusByInstitute(inst, id, body.get("status")), "Updated"));
    }

    // ── Onboarding ────────────────────────────────────────────────────────────

    @GetMapping("/application/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getApplicationStatus(@AuthenticationPrincipal User user) {
        Institute inst = getInstitute(user);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("status", inst.getStatus().name());
        data.put("onboardingComplete", Boolean.TRUE.equals(inst.getOnboardingComplete()));
        data.put("setupComplete", Boolean.TRUE.equals(inst.getSetupComplete()));
        data.put("submittedAt", inst.getRegistrationDate() != null ? inst.getRegistrationDate().toString() : null);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PutMapping("/onboarding/info")
    public ResponseEntity<ApiResponse<Institute>> saveOnboardingInfo(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        Institute inst = instituteRepo.findByUser(user)
                .orElseGet(() -> instituteRepo.save(Institute.builder()
                        .user(user).name(user.getEmail().split("@")[0])
                        .status(Institute.Status.PENDING).build()));
        if (body.containsKey("name"))               inst.setName((String) body.get("name"));
        if (body.containsKey("type"))               inst.setType((String) body.get("type"));
        if (body.containsKey("websiteUrl"))         inst.setWebsiteUrl((String) body.get("websiteUrl"));
        if (body.containsKey("buildingName"))       inst.setBuildingName((String) body.get("buildingName"));
        if (body.containsKey("roomFloor"))          inst.setRoomFloor((String) body.get("roomFloor"));
        if (body.containsKey("country"))            inst.setCountry((String) body.get("country"));
        if (body.containsKey("pincode"))            inst.setPincode((String) body.get("pincode"));
        if (body.containsKey("state"))              inst.setState((String) body.get("state"));
        if (body.containsKey("city"))               inst.setCity((String) body.get("city"));
        if (body.containsKey("area"))               inst.setArea((String) body.get("area"));
        if (body.containsKey("landmark"))           inst.setLandmark((String) body.get("landmark"));
        if (body.containsKey("locationPin"))        inst.setLocationPin((String) body.get("locationPin"));
        if (body.containsKey("accreditationBody"))  inst.setAccreditationBody((String) body.get("accreditationBody"));
        if (body.containsKey("accreditationCertUrl")) inst.setAccreditationCertUrl((String) body.get("accreditationCertUrl"));
        if (body.containsKey("universityCertUrl")) inst.setUniversityCertUrl((String) body.get("universityCertUrl"));
        if (body.containsKey("ratingDocUrl"))       inst.setRatingDocUrl((String) body.get("ratingDocUrl"));
        if (body.containsKey("ugcCertUrl"))         inst.setUgcCertUrl((String) body.get("ugcCertUrl"));
        if (body.containsKey("mouUrl"))             inst.setMouUrl((String) body.get("mouUrl"));
        if (body.containsKey("contactsJson"))       inst.setContactsJson((String) body.get("contactsJson"));
        return ResponseEntity.ok(ApiResponse.ok(instituteRepo.save(inst), "Info saved"));
    }

    @PutMapping("/onboarding/services")
    public ResponseEntity<ApiResponse<Institute>> saveOnboardingServices(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        Institute inst = getInstitute(user);
        if (body.containsKey("servicesAvail")) inst.setServicesAvail(toStringList(body.get("servicesAvail")));
        if (body.containsKey("servicesOffer")) inst.setServicesOffer(toStringList(body.get("servicesOffer")));
        return ResponseEntity.ok(ApiResponse.ok(instituteRepo.save(inst), "Services saved"));
    }

    @PostMapping("/onboarding/payment")
    public ResponseEntity<ApiResponse<Institute>> saveOnboardingPayment(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        Institute inst = getInstitute(user);
        if (body.containsKey("paymentMethod")) inst.setPaymentMethod((String) body.get("paymentMethod"));
        if (body.containsKey("paymentAmount")) inst.setPaymentAmount(toDouble(body.get("paymentAmount"), 0));
        inst.setOnboardingComplete(true);
        inst.setStatus(Institute.Status.SUBMITTED);
        return ResponseEntity.ok(ApiResponse.ok(instituteRepo.save(inst), "Payment recorded. Application submitted."));
    }

    @PostMapping("/setup/complete")
    public ResponseEntity<ApiResponse<Institute>> completeSetup(@AuthenticationPrincipal User user) {
        Institute inst = getInstitute(user);
        inst.setSetupComplete(true);
        inst.setStatus(Institute.Status.UNDER_REVIEW);
        return ResponseEntity.ok(ApiResponse.ok(instituteRepo.save(inst), "Setup complete. Application under review."));
    }

    // ── BOS Members ───────────────────────────────────────────────────────────

    @GetMapping("/bos-members")
    public ResponseEntity<ApiResponse<List<BosMember>>> getBosMember(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(bosMemberRepo.findByInstitute(getInstitute(user))));
    }

    @PostMapping("/bos-members")
    public ResponseEntity<ApiResponse<BosMember>> addBosMember(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String name  = (String) body.get("name");
        BosMember b = BosMember.builder()
                .institute(getInstitute(user))
                .name(name)
                .organization((String) body.get("organization"))
                .designation((String) body.get("designation"))
                .expertise((String) body.get("expertise"))
                .department((String) body.get("department"))
                .email(email)
                .phone((String) body.get("phone"))
                .build();
        bosMemberRepo.save(b);

        // Auto-create a BOS_MEMBER login if email provided and not already registered
        if (email != null && !email.isBlank() && !userRepo.existsByEmail(email)) {
            User bosUser = User.builder()
                    .email(email)
                    .name(name != null ? name : email)
                    .password(passwordEncoder.encode(email)) // default password = email
                    .role(User.Role.BOS_MEMBER)
                    .enabled(true)
                    .build();
            userRepo.save(bosUser);
        }

        return ResponseEntity.ok(ApiResponse.ok(b, "BOS member added"));
    }

    // ── Workshops ────────────────────────────────────────────────────────────

    @GetMapping("/workshops")
    public ResponseEntity<ApiResponse<List<com.hubblehox.e2j.dto.WorkshopPostingDto.Response>>> listWorkshops(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(workshopPostingService.listForInstitute(getInstitute(user))));
    }

    /** All approved workshops (regardless of poster) — used so an institute can bulk-enroll students into any live workshop. */
    @GetMapping("/workshops/browse")
    public ResponseEntity<ApiResponse<List<com.hubblehox.e2j.dto.WorkshopPostingDto.Response>>> browseApprovedWorkshops() {
        return ResponseEntity.ok(ApiResponse.ok(workshopPostingService.listApprovedForInstitute()));
    }

    @GetMapping("/workshops/{id}/enrollments")
    public ResponseEntity<ApiResponse<List<com.hubblehox.e2j.dto.WorkshopEnrollmentDto.RosterRow>>> workshopEnrollments(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Institute inst = getInstitute(user);
        com.hubblehox.e2j.entity.WorkshopPosting workshop = workshopPostingService.findById(id);
        if (workshop.getInstitute() == null || !workshop.getInstitute().getId().equals(inst.getId()))
            throw new AppException("Unauthorized", HttpStatus.FORBIDDEN);
        return ResponseEntity.ok(ApiResponse.ok(workshopEnrollmentService.rosterForWorkshop(workshop)));
    }

    @GetMapping("/workshops/{id}/reviews")
    public ResponseEntity<ApiResponse<List<com.hubblehox.e2j.dto.WorkshopReviewDto.Response>>> workshopReviews(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        Institute inst = getInstitute(user);
        com.hubblehox.e2j.entity.WorkshopPosting workshop = workshopPostingService.findById(id);
        if (workshop.getInstitute() == null || !workshop.getInstitute().getId().equals(inst.getId()))
            throw new AppException("Unauthorized", HttpStatus.FORBIDDEN);
        return ResponseEntity.ok(ApiResponse.ok(workshopReviewService.forWorkshop(id)));
    }

    @PostMapping("/workshops")
    public ResponseEntity<ApiResponse<com.hubblehox.e2j.dto.WorkshopPostingDto.Response>> createWorkshop(
            @AuthenticationPrincipal User user,
            @RequestBody com.hubblehox.e2j.dto.WorkshopPostingDto.CreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                workshopPostingService.createForInstitute(getInstitute(user), req), "Workshop submitted for approval"));
    }

    @PutMapping("/workshops/{id}")
    public ResponseEntity<ApiResponse<com.hubblehox.e2j.dto.WorkshopPostingDto.Response>> updateWorkshop(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody com.hubblehox.e2j.dto.WorkshopPostingDto.CreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                workshopPostingService.updateForInstitute(getInstitute(user), id, req), "Workshop updated and resubmitted for approval"));
    }

    @PostMapping("/workshops/{id}/bulk-enroll")
    public ResponseEntity<ApiResponse<com.hubblehox.e2j.dto.WorkshopEnrollmentDto.BulkEnrollResult>> bulkEnrollWorkshop(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody com.hubblehox.e2j.dto.WorkshopEnrollmentDto.BulkEnrollRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                workshopEnrollmentService.bulkEnroll(getInstitute(user), id, req.getInstituteStudentIds()), "Bulk enrollment processed"));
    }

    @PutMapping("/bos-members/{id}")
    public ResponseEntity<ApiResponse<BosMember>> updateBosMember(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        BosMember b = bosMemberRepo.findByIdAndInstitute(id, getInstitute(user))
                .orElseThrow(() -> new AppException("BOS member not found", HttpStatus.NOT_FOUND));
        if (body.containsKey("name"))         b.setName((String) body.get("name"));
        if (body.containsKey("organization")) b.setOrganization((String) body.get("organization"));
        if (body.containsKey("designation"))  b.setDesignation((String) body.get("designation"));
        if (body.containsKey("expertise"))    b.setExpertise((String) body.get("expertise"));
        if (body.containsKey("department"))   b.setDepartment((String) body.get("department"));
        if (body.containsKey("email"))        b.setEmail((String) body.get("email"));
        if (body.containsKey("phone"))        b.setPhone((String) body.get("phone"));
        return ResponseEntity.ok(ApiResponse.ok(bosMemberRepo.save(b), "Updated"));
    }

    @DeleteMapping("/bos-members/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBosMember(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        BosMember b = bosMemberRepo.findByIdAndInstitute(id, getInstitute(user))
                .orElseThrow(() -> new AppException("BOS member not found", HttpStatus.NOT_FOUND));
        bosMemberRepo.delete(b);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    /** One-time sync: creates BOS_MEMBER user accounts for any BOS member who doesn't have one yet */
    @PostMapping("/bos-members/sync-accounts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncBosAccounts(@AuthenticationPrincipal User user) {
        List<BosMember> members = bosMemberRepo.findByInstitute(getInstitute(user));
        int created = 0;
        int skipped = 0;
        for (BosMember bm : members) {
            String email = bm.getEmail();
            if (email == null || email.isBlank()) { skipped++; continue; }
            if (userRepo.existsByEmail(email)) { skipped++; continue; }
            User bosUser = User.builder()
                    .email(email)
                    .name(bm.getName() != null ? bm.getName() : email)
                    .password(passwordEncoder.encode(email))
                    .role(User.Role.BOS_MEMBER)
                    .enabled(true)
                    .build();
            userRepo.save(bosUser);
            created++;
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("created", created, "skipped", skipped), "Sync complete"));
    }

    // ── Infra — Basic / Safety / Power ────────────────────────────────────────

    @GetMapping("/infra")
    public ResponseEntity<ApiResponse<InstituteInfra>> getInfra(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                infraRepo.findByInstitute(getInstitute(user)).orElse(null)));
    }

    @PutMapping("/infra")
    public ResponseEntity<ApiResponse<InstituteInfra>> saveInfra(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        Institute inst = getInstitute(user);
        InstituteInfra infra = infraRepo.findByInstitute(inst).orElse(InstituteInfra.builder().institute(inst).build());
        if (body.containsKey("buildingEntranceImg")) infra.setBuildingEntranceImg((String) body.get("buildingEntranceImg"));
        if (body.containsKey("numFloors"))           infra.setNumFloors(toInt(body.get("numFloors"), 0));
        if (body.containsKey("landArea"))            infra.setLandArea((String) body.get("landArea"));
        if (body.containsKey("builtUpArea"))         infra.setBuiltUpArea((String) body.get("builtUpArea"));
        if (body.containsKey("landOwnerName"))       infra.setLandOwnerName((String) body.get("landOwnerName"));
        if (body.containsKey("separateGates"))       infra.setSeparateGates((Boolean) body.get("separateGates"));
        if (body.containsKey("entryGateImg"))        infra.setEntryGateImg((String) body.get("entryGateImg"));
        if (body.containsKey("exitGateImg"))         infra.setExitGateImg((String) body.get("exitGateImg"));
        if (body.containsKey("registrationDeskImg")) infra.setRegistrationDeskImg((String) body.get("registrationDeskImg"));
        if (body.containsKey("receptionAreaImg"))    infra.setReceptionAreaImg((String) body.get("receptionAreaImg"));
        if (body.containsKey("parking"))             infra.setParking((Boolean) body.get("parking"));
        if (body.containsKey("pwd"))                 infra.setPwd((Boolean) body.get("pwd"));
        if (body.containsKey("pwdImg"))              infra.setPwdImg((String) body.get("pwdImg"));
        if (body.containsKey("liftCount"))           infra.setLiftCount(toInt(body.get("liftCount"), 0));
        if (body.containsKey("liftImg"))             infra.setLiftImg((String) body.get("liftImg"));
        if (body.containsKey("washroomsAvailable"))  infra.setWashroomsAvailable((Boolean) body.get("washroomsAvailable"));
        if (body.containsKey("washroomsPerFloor"))   infra.setWashroomsPerFloor((Boolean) body.get("washroomsPerFloor"));
        if (body.containsKey("washroomsImg"))        infra.setWashroomsImg((String) body.get("washroomsImg"));
        if (body.containsKey("separateWashrooms"))   infra.setSeparateWashrooms((Boolean) body.get("separateWashrooms"));
        if (body.containsKey("maleWashroomImg"))     infra.setMaleWashroomImg((String) body.get("maleWashroomImg"));
        if (body.containsKey("femaleWashroomImg"))   infra.setFemaleWashroomImg((String) body.get("femaleWashroomImg"));
        if (body.containsKey("cctvAvailable"))       infra.setCctvAvailable((Boolean) body.get("cctvAvailable"));
        if (body.containsKey("cctvImg"))             infra.setCctvImg((String) body.get("cctvImg"));
        if (body.containsKey("drinkingWater"))       infra.setDrinkingWater((Boolean) body.get("drinkingWater"));
        if (body.containsKey("drinkingWaterImg"))    infra.setDrinkingWaterImg((String) body.get("drinkingWaterImg"));
        if (body.containsKey("acAvailable"))         infra.setAcAvailable((Boolean) body.get("acAvailable"));
        if (body.containsKey("acImg"))               infra.setAcImg((String) body.get("acImg"));
        if (body.containsKey("firstAidKit"))         infra.setFirstAidKit((Boolean) body.get("firstAidKit"));
        if (body.containsKey("firstAidKitImg"))      infra.setFirstAidKitImg((String) body.get("firstAidKitImg"));
        if (body.containsKey("fireExtPerFloor"))     infra.setFireExtPerFloor((Boolean) body.get("fireExtPerFloor"));
        if (body.containsKey("fireExtAccessible"))   infra.setFireExtAccessible((Boolean) body.get("fireExtAccessible"));
        if (body.containsKey("fireExtImg"))          infra.setFireExtImg((String) body.get("fireExtImg"));
        if (body.containsKey("assemblyArea"))        infra.setAssemblyArea((Boolean) body.get("assemblyArea"));
        if (body.containsKey("safetySigns"))         infra.setSafetySigns((Boolean) body.get("safetySigns"));
        if (body.containsKey("insurance"))           infra.setInsurance((Boolean) body.get("insurance"));
        if (body.containsKey("powerGenset"))         infra.setPowerGenset((Boolean) body.get("powerGenset"));
        if (body.containsKey("gensetType"))          infra.setGensetType((String) body.get("gensetType"));
        if (body.containsKey("dgCapacity"))          infra.setDgCapacity((String) body.get("dgCapacity"));
        if (body.containsKey("upsAvailable"))        infra.setUpsAvailable((Boolean) body.get("upsAvailable"));
        return ResponseEntity.ok(ApiResponse.ok(infraRepo.save(infra), "Infra saved"));
    }

    // ── Rooms ─────────────────────────────────────────────────────────────────

    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<InstituteRoom>>> getRooms(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(roomRepo.findByInstitute(getInstitute(user))));
    }

    @PostMapping("/rooms")
    public ResponseEntity<ApiResponse<InstituteRoom>> addRoom(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        InstituteRoom r = InstituteRoom.builder()
                .institute(getInstitute(user))
                .roomType((String) body.get("roomType"))
                .roomCount(toInt(body.get("roomCount"), 0))
                .area((String) body.get("area"))
                .personCapacity(toInt(body.get("personCapacity"), 0))
                .equipment(toStringList(body.get("equipment")))
                .notes((String) body.get("notes"))
                .pricing(toDouble(body.get("pricing"), 0))
                .pricingUnit((String) body.get("pricingUnit"))
                .build();
        return ResponseEntity.ok(ApiResponse.ok(roomRepo.save(r), "Room added"));
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<ApiResponse<InstituteRoom>> updateRoom(
            @AuthenticationPrincipal User user, @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        InstituteRoom r = roomRepo.findByIdAndInstitute(id, getInstitute(user))
                .orElseThrow(() -> new AppException("Room not found", HttpStatus.NOT_FOUND));
        if (body.containsKey("roomType"))       r.setRoomType((String) body.get("roomType"));
        if (body.containsKey("roomCount"))      r.setRoomCount(toInt(body.get("roomCount"), 0));
        if (body.containsKey("area"))           r.setArea((String) body.get("area"));
        if (body.containsKey("personCapacity")) r.setPersonCapacity(toInt(body.get("personCapacity"), 0));
        if (body.containsKey("equipment"))      r.setEquipment(toStringList(body.get("equipment")));
        if (body.containsKey("notes"))          r.setNotes((String) body.get("notes"));
        if (body.containsKey("pricing"))        r.setPricing(toDouble(body.get("pricing"), 0));
        if (body.containsKey("pricingUnit"))    r.setPricingUnit((String) body.get("pricingUnit"));
        return ResponseEntity.ok(ApiResponse.ok(roomRepo.save(r), "Updated"));
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        InstituteRoom r = roomRepo.findByIdAndInstitute(id, getInstitute(user))
                .orElseThrow(() -> new AppException("Room not found", HttpStatus.NOT_FOUND));
        roomRepo.delete(r);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    // ── Labs ──────────────────────────────────────────────────────────────────

    @GetMapping("/labs")
    public ResponseEntity<ApiResponse<List<InstituteLab>>> getLabs(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(labRepo.findByInstitute(getInstitute(user))));
    }

    @PostMapping("/labs")
    public ResponseEntity<ApiResponse<InstituteLab>> addLab(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        InstituteLab l = buildLabFromBody(InstituteLab.builder().institute(getInstitute(user)).build(), body);
        return ResponseEntity.ok(ApiResponse.ok(labRepo.save(l), "Lab added"));
    }

    @PutMapping("/labs/{id}")
    public ResponseEntity<ApiResponse<InstituteLab>> updateLab(
            @AuthenticationPrincipal User user, @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        InstituteLab l = labRepo.findByIdAndInstitute(id, getInstitute(user))
                .orElseThrow(() -> new AppException("Lab not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(labRepo.save(buildLabFromBody(l, body)), "Updated"));
    }

    @DeleteMapping("/labs/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLab(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        InstituteLab l = labRepo.findByIdAndInstitute(id, getInstitute(user))
                .orElseThrow(() -> new AppException("Lab not found", HttpStatus.NOT_FOUND));
        labRepo.delete(l);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    private InstituteLab buildLabFromBody(InstituteLab l, Map<String, Object> b) {
        if (b.containsKey("labName"))               l.setLabName((String) b.get("labName"));
        if (b.containsKey("buildingName"))           l.setBuildingName((String) b.get("buildingName"));
        if (b.containsKey("floor"))                  l.setFloor((String) b.get("floor"));
        if (b.containsKey("labImg"))                 l.setLabImg((String) b.get("labImg"));
        if (b.containsKey("labCorridorImg"))         l.setLabCorridorImg((String) b.get("labCorridorImg"));
        if (b.containsKey("labEntranceImg"))         l.setLabEntranceImg((String) b.get("labEntranceImg"));
        if (b.containsKey("labPhotoFrontLeft"))      l.setLabPhotoFrontLeft((String) b.get("labPhotoFrontLeft"));
        if (b.containsKey("labPhotoFrontRight"))     l.setLabPhotoFrontRight((String) b.get("labPhotoFrontRight"));
        if (b.containsKey("acAvailable"))            l.setAcAvailable((Boolean) b.get("acAvailable"));
        if (b.containsKey("fansAvailable"))          l.setFansAvailable((Boolean) b.get("fansAvailable"));
        if (b.containsKey("noiseFree"))              l.setNoiseFree((Boolean) b.get("noiseFree"));
        if (b.containsKey("partition"))              l.setPartition((Boolean) b.get("partition"));
        if (b.containsKey("lighting"))               l.setLighting((Boolean) b.get("lighting"));
        if (b.containsKey("printer"))                l.setPrinter((Boolean) b.get("printer"));
        if (b.containsKey("cctvAvailable"))          l.setCctvAvailable((Boolean) b.get("cctvAvailable"));
        if (b.containsKey("cctvCount"))              l.setCctvCount(toInt(b.get("cctvCount"), 0));
        if (b.containsKey("cctvNodes"))              l.setCctvNodes(toInt(b.get("cctvNodes"), 0));
        if (b.containsKey("cctvDays"))               l.setCctvDays(toInt(b.get("cctvDays"), 0));
        if (b.containsKey("cctvHighQuality"))        l.setCctvHighQuality((Boolean) b.get("cctvHighQuality"));
        if (b.containsKey("blindSpots"))             l.setBlindSpots((Boolean) b.get("blindSpots"));
        if (b.containsKey("blindSpotImg"))           l.setBlindSpotImg((String) b.get("blindSpotImg"));
        if (b.containsKey("networkType"))            l.setNetworkType((String) b.get("networkType"));
        if (b.containsKey("lanSingleMultiple"))      l.setLanSingleMultiple((String) b.get("lanSingleMultiple"));
        if (b.containsKey("lanType"))                l.setLanType((String) b.get("lanType"));
        if (b.containsKey("networkTopology"))        l.setNetworkTopology((String) b.get("networkTopology"));
        if (b.containsKey("networkSpeed"))           l.setNetworkSpeed(toInt(b.get("networkSpeed"), 0));
        if (b.containsKey("numComputers"))           l.setNumComputers(toInt(b.get("numComputers"), 0));
        if (b.containsKey("numBuffers"))             l.setNumBuffers(toInt(b.get("numBuffers"), 0));
        if (b.containsKey("computerCompany"))        l.setComputerCompany((String) b.get("computerCompany"));
        if (b.containsKey("ramCapacity"))            l.setRamCapacity((String) b.get("ramCapacity"));
        if (b.containsKey("operatingSystem"))        l.setOperatingSystem((String) b.get("operatingSystem"));
        if (b.containsKey("browserName"))            l.setBrowserName((String) b.get("browserName"));
        if (b.containsKey("browserVersion"))         l.setBrowserVersion((String) b.get("browserVersion"));
        if (b.containsKey("computerPartitionsImg"))  l.setComputerPartitionsImg((String) b.get("computerPartitionsImg"));
        if (b.containsKey("computerNumberingImg"))   l.setComputerNumberingImg((String) b.get("computerNumberingImg"));
        if (b.containsKey("computerMonitorImg"))     l.setComputerMonitorImg((String) b.get("computerMonitorImg"));
        if (b.containsKey("deskImg"))                l.setDeskImg((String) b.get("deskImg"));
        if (b.containsKey("cpuImg"))                 l.setCpuImg((String) b.get("cpuImg"));
        if (b.containsKey("upsImg"))                 l.setUpsImg((String) b.get("upsImg"));
        if (b.containsKey("pricing"))                l.setPricing(toDouble(b.get("pricing"), 0));
        if (b.containsKey("pricingUnit"))            l.setPricingUnit((String) b.get("pricingUnit"));
        return l;
    }

    // ── Conversion helpers ────────────────────────────────────────────────────

    private List<String> toStringList(Object val) {
        if (val instanceof List<?> l) return new java.util.ArrayList<>(l.stream().map(Object::toString).toList());
        return new java.util.ArrayList<>();
    }

    private int toInt(Object val, int fallback) {
        if (val instanceof Number n) return n.intValue();
        return fallback;
    }

    private double toDouble(Object val, double fallback) {
        if (val instanceof Number n) return n.doubleValue();
        return fallback;
    }

    private LocalDate parseDate(Object val) {
        if (val instanceof String s && !s.isBlank()) return LocalDate.parse(s);
        return null;
    }

    private LocalTime parseTime(Object val) {
        if (val instanceof String s && !s.isBlank()) return LocalTime.parse(s);
        return null;
    }
}
