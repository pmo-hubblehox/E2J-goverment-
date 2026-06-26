package com.hubblehox.e2j.service;

import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExcelService {

    private final ProgramRepository programRepo;
    private final FacultyRepository facultyRepo;
    private final InstituteStudentRepository studentRepo;
    private final UserRepository userRepo;
    private final StudentRepository studentAccountRepo;
    private final StudentEducationRepository educationRepo;
    private final PasswordEncoder passwordEncoder;
    private final JobPostingRepository jobPostingRepo;
    private final IndustrySmeRepository smeRepo;
    private final IndustryPartnerRepository industryPartnerRepo;

    // ── Cell readers ──────────────────────────────────────────────────────────

    private String str(Cell c) {
        if (c == null) return "";
        return switch (c.getCellType()) {
            case STRING  -> c.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) c.getNumericCellValue());
            case BOOLEAN -> String.valueOf(c.getBooleanCellValue());
            default      -> "";
        };
    }

    private double num(Cell c) {
        if (c == null) return 0;
        return c.getCellType() == CellType.NUMERIC ? c.getNumericCellValue() : 0;
    }

    // ── Bulk upload: Programs ─────────────────────────────────────────────────

    public int bulkUploadPrograms(MultipartFile file, Institute institute) throws IOException {
        int count = 0;
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String degree = str(row.getCell(0));
                String name   = str(row.getCell(1));
                if (degree.isBlank() || name.isBlank()) continue;
                String majorsRaw = str(row.getCell(5));
                List<String> majors = majorsRaw.isBlank() ? List.of()
                        : List.of(majorsRaw.split(",")).stream().map(String::trim).toList();
                Program p = Program.builder()
                        .institute(institute)
                        .degree(degree)
                        .name(name)
                        .duration((int) num(row.getCell(2)))
                        .intakeCapacity((int) num(row.getCell(3)))
                        .totalFees(num(row.getCell(4)))
                        .majors(majors)
                        .status(Program.Status.DRAFT)
                        .build();
                programRepo.save(p);
                count++;
            }
        }
        return count;
    }

    // ── Bulk upload: Faculty ──────────────────────────────────────────────────

    public int bulkUploadFaculty(MultipartFile file, Institute institute) throws IOException {
        int count = 0;
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String name = str(row.getCell(0));
                if (name.isBlank()) continue;
                Faculty f = Faculty.builder()
                        .institute(institute)
                        .name(name)
                        .expertise(splitCsv(str(row.getCell(1))))
                        .days(splitCsv(str(row.getCell(2))))
                        .mode(str(row.getCell(3)))
                        .bio(str(row.getCell(4)))
                        .status(Faculty.Status.AVAILABLE)
                        .build();
                facultyRepo.save(f);
                count++;
            }
        }
        return count;
    }

    // ── Bulk upload: Students ─────────────────────────────────────────────────
    // Columns: Student ID | Full Name | Email | Phone | Degree/Qualification | School/University | Major/Specialization | Year Of Passing | CGPA

    public int bulkUploadStudents(MultipartFile file, Institute institute) throws IOException {
        int count = 0;
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String name = str(row.getCell(1));
                if (name.isBlank()) continue;
                String email        = str(row.getCell(2));
                String phone        = str(row.getCell(3));
                String degree       = str(row.getCell(4));
                String school       = str(row.getCell(5));
                String major        = str(row.getCell(6));
                String yearOfPassing= str(row.getCell(7));
                double cgpa         = num(row.getCell(8));

                InstituteStudent s = InstituteStudent.builder()
                        .institute(institute)
                        .studentId(str(row.getCell(0)))
                        .name(name)
                        .email(email)
                        .phone(phone)
                        .degree(degree)
                        .schoolUniversity(school)
                        .major(major)
                        .yearOfPassing(yearOfPassing)
                        .cgpa(cgpa > 0 ? cgpa : null)
                        .status(InstituteStudent.Status.ACTIVE)
                        .build();
                studentRepo.save(s);

                // Auto-create student account if email provided and no account yet
                if (!email.isBlank() && !userRepo.existsByEmail(email)) {
                    User user = User.builder()
                            .email(email)
                            .name(name)
                            .password(passwordEncoder.encode(email))
                            .role(User.Role.STUDENT)
                            .enabled(true)
                            .build();
                    userRepo.save(user);

                    Student studentAccount = Student.builder()
                            .user(user)
                            .phone(phone.isBlank() ? null : phone)
                            .build();
                    studentAccountRepo.save(studentAccount);

                    // Pre-populate education details from upload data (locked — student cannot edit)
                    if (!degree.isBlank() || !school.isBlank()) {
                        StudentEducation edu = StudentEducation.builder()
                                .student(studentAccount)
                                .degree(degree)
                                .schoolUniversity(school)
                                .majorSpecialization(major)
                                .yearOfPassing(yearOfPassing)
                                .percentageCgpa(cgpa > 0 ? String.valueOf(cgpa) : null)
                                .locked(true)
                                .build();
                        educationRepo.save(edu);
                    }
                }

                count++;
            }
        }
        return count;
    }

    // Used by manual add student (InstituteController)
    public void provisionStudentAccount(String email, String name, String phone,
                                         String degree, String school, String major,
                                         String yearOfPassing, String cgpa) {
        if (email == null || email.isBlank() || userRepo.existsByEmail(email)) return;
        User user = User.builder()
                .email(email).name(name)
                .password(passwordEncoder.encode(email))
                .role(User.Role.STUDENT).enabled(true)
                .build();
        userRepo.save(user);
        Student studentAccount = Student.builder()
                .user(user)
                .phone(phone == null || phone.isBlank() ? null : phone)
                .build();
        studentAccountRepo.save(studentAccount);
        if (degree != null && !degree.isBlank() || school != null && !school.isBlank()) {
            StudentEducation edu = StudentEducation.builder()
                    .student(studentAccount)
                    .degree(degree).schoolUniversity(school)
                    .majorSpecialization(major).yearOfPassing(yearOfPassing)
                    .percentageCgpa(cgpa)
                    .locked(true)
                    .build();
            educationRepo.save(edu);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<String> splitCsv(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return List.of(raw.split(",")).stream().map(String::trim).filter(s -> !s.isBlank()).toList();
    }

    private byte[] buildWorkbook(String sheetName, String[] headers, Object[][] data,
                                  String[] instrHeaders, String[][] instrData) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Header cell style
            CellStyle hStyle = wb.createCellStyle();
            Font hFont = wb.createFont();
            hFont.setBold(true);
            hFont.setColor(IndexedColors.WHITE.getIndex());
            hStyle.setFont(hFont);
            hStyle.setFillForegroundColor(IndexedColors.INDIGO.getIndex());
            hStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            hStyle.setBorderBottom(BorderStyle.THIN);

            // Data sheet
            Sheet sheet = wb.createSheet(sheetName);
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell c = hRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(hStyle);
                sheet.setColumnWidth(i, 6000);
            }
            for (int r = 0; r < data.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < data[r].length; c++) {
                    Cell cell = row.createCell(c);
                    Object v = data[r][c];
                    if (v instanceof Number) cell.setCellValue(((Number) v).doubleValue());
                    else cell.setCellValue(v == null ? "" : v.toString());
                }
            }

            // Instructions sheet
            Sheet instr = wb.createSheet("Instructions");
            Row titleRow = instr.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("COLUMN INSTRUCTIONS — do not modify column order");
            CellStyle titleStyle = wb.createCellStyle();
            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 12);
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            Row iHeader = instr.createRow(2);
            for (int i = 0; i < instrHeaders.length; i++) {
                Cell c = iHeader.createCell(i);
                c.setCellValue(instrHeaders[i]);
                c.setCellStyle(hStyle);
                instr.setColumnWidth(i, 7000);
            }
            for (int r = 0; r < instrData.length; r++) {
                Row row = instr.createRow(r + 3);
                for (int c = 0; c < instrData[r].length; c++) row.createCell(c).setCellValue(instrData[r][c]);
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ── Sample Excel generators ───────────────────────────────────────────────

    public byte[] sampleProgramsExcel() throws IOException {
        String[] headers = {"Degree", "Program Name", "Duration (Years)", "Intake Capacity", "Total Fees (INR)", "Majors (comma-separated)"};
        Object[][] data = {
            {"B.Tech", "Computer Engineering", 4, 60, 120000, "Artificial Intelligence & Data Science,Robotics"},
            {"B.Tech", "Information Technology", 4, 60, 110000, "Cloud Computing,Cyber Security"},
            {"M.Tech", "Computer Science", 2, 30, 150000, "Machine Learning,Deep Learning"},
        };
        String[] ih = {"Column", "Description", "Example", "Required"};
        String[][] id = {
            {"Degree",          "Degree type",                       "B.Tech",          "Yes"},
            {"Program Name",    "Full program name",                  "Computer Eng.",   "Yes"},
            {"Duration",        "Duration in years",                  "4",               "Yes"},
            {"Intake Capacity", "Number of seats",                    "60",              "Yes"},
            {"Total Fees",      "Annual fees in INR (numbers only)",  "120000",          "No"},
            {"Majors",          "Comma-separated specializations",    "AI & DS,Robotics","No"},
        };
        return buildWorkbook("Programs", headers, data, ih, id);
    }

    public byte[] sampleFacultyExcel() throws IOException {
        String[] headers = {"Full Name", "Expertise (comma-separated)", "Available Days (comma-separated)", "Delivery Mode", "Bio"};
        Object[][] data = {
            {"Dr. Manisha Joshi", "Applied Cryptography,Computer Networks", "Mon,Wed,Fri", "Hybrid",  "Expert in cybersecurity with 14 years experience."},
            {"Prof. Rajesh Kumar", "Python,Data Science,ML",                "Tue,Thu",    "Online",  "Data scientist and ML educator."},
            {"Dr. Priya Nair",    "VLSI,Embedded Systems",                  "Mon,Fri",    "Offline", "Electronics expert with industry background."},
        };
        String[] ih = {"Column", "Description", "Example", "Required"};
        String[][] id = {
            {"Full Name",      "Faculty full name",                         "Dr. Manisha Joshi",      "Yes"},
            {"Expertise",      "Comma-separated expertise areas",           "Python,ML,AI",           "Yes"},
            {"Available Days", "Short day names comma-separated",           "Mon,Wed,Fri",            "No"},
            {"Delivery Mode",  "Online / Offline / Hybrid",                 "Hybrid",                 "No"},
            {"Bio",            "Brief biography (max 500 chars)",           "Expert in...",           "No"},
        };
        return buildWorkbook("Faculty", headers, data, ih, id);
    }

    public byte[] sampleStudentsExcel() throws IOException {
        String[] headers = {"Student ID", "Full Name", "Email", "Phone", "Degree/Qualification", "School/University", "Major/Specialization", "Year Of Passing", "CGPA"};
        Object[][] data = {
            {"STU001", "Ria Sheth",    "ria@institute.edu",   "9876543210", "B.Tech", "AIET",         "Computer Science",   "2024", 8.7},
            {"STU002", "Arjun Mehta", "arjun@institute.edu", "9876543211", "B.Tech", "VIT Vellore",   "Cloud Computing",    "2025", 7.9},
            {"STU003", "Priya Singh", "priya@institute.edu", "9876543212", "M.Tech", "IIT Bombay",    "Artificial Intelligence", "2024", 9.1},
        };
        String[] ih = {"Column", "Description", "Example", "Required"};
        String[][] id = {
            {"Student ID",           "Unique student identifier",                "STU001",              "Yes"},
            {"Full Name",            "Student full name",                        "Ria Sheth",           "Yes"},
            {"Email",                "Student email — used as login ID",         "ria@institute.edu",   "No"},
            {"Phone",                "10-digit mobile number",                   "9876543210",          "No"},
            {"Degree/Qualification", "Degree type e.g. B.Tech, M.Tech, BCA",    "B.Tech",              "No"},
            {"School/University",    "Name of school or university",             "AIET",                "No"},
            {"Major/Specialization", "Area of specialization",                   "Computer Science",    "No"},
            {"Year Of Passing",      "Year of graduation/passing",               "2024",                "No"},
            {"CGPA",                 "CGPA out of 10 (decimal allowed)",         "8.7",                 "No"},
        };
        return buildWorkbook("Students", headers, data, ih, id);
    }

    public byte[] sampleCreditStructureExcel() throws IOException {
        String[] headers = {
            "Semester", "Subject Code", "Subject Name",
            "Theory Credits", "Practical Credits", "Tutorial Credits", "Total Credits",
            "Theory Hrs/Week", "Practical Hrs/Week", "Exam Duration (Hrs)"
        };
        Object[][] data = {
            {"Semester 1", "CS101", "Engineering Mathematics I", 4, 0, 1, 5, 4, 0, 3},
            {"Semester 1", "CS102", "Programming Fundamentals",  3, 1, 0, 4, 3, 2, 3},
            {"Semester 2", "CS201", "Data Structures",           3, 1, 0, 4, 3, 2, 3},
            {"Semester 2", "CS202", "Digital Electronics",       3, 1, 0, 4, 3, 2, 3},
        };
        String[] ih = {"Column", "Description"};
        String[][] id = {
            {"Semester",          "Semester name e.g. Semester 1"},
            {"Subject Code",      "Unique subject code e.g. CS101"},
            {"Theory Credits",    "Credits for theory component"},
            {"Practical Credits", "Credits for lab/practical component"},
            {"Tutorial Credits",  "Credits for tutorial component"},
            {"Total Credits",     "Sum of theory + practical + tutorial"},
            {"Theory Hrs/Week",   "Theory teaching hours per week"},
        };
        return buildWorkbook("Credit Structure", headers, data, ih, id);
    }

    // ── Bulk upload: Job Postings ─────────────────────────────────────────────
    // Columns: Type | Job Role | Department | Employment Type | Work Mode | Location | Positions | Target Date (YYYY-MM-DD) | Status

    public int bulkUploadJobs(MultipartFile file, IndustryPartner partner) throws IOException {
        int count = 0;
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String type    = str(row.getCell(0)).toUpperCase();
                String jobRole = str(row.getCell(1));
                if (jobRole.isBlank()) continue;
                String dateStr = str(row.getCell(7));
                LocalDate targetDate = null;
                try { if (!dateStr.isBlank()) targetDate = LocalDate.parse(dateStr); } catch (Exception ignored) {}
                String statusStr = str(row.getCell(8)).toUpperCase();
                JobPosting.Status status = JobPosting.Status.DRAFT;
                try { status = JobPosting.Status.valueOf(statusStr); } catch (Exception ignored) {}
                JobPosting jp = JobPosting.builder()
                        .partner(partner)
                        .postingType("INTERNSHIP".equals(type) ? JobPosting.PostingType.INTERNSHIP : JobPosting.PostingType.JOB)
                        .jobRole(jobRole)
                        .department(str(row.getCell(2)))
                        .employmentType(str(row.getCell(3)))
                        .workMode(str(row.getCell(4)))
                        .location(str(row.getCell(5)))
                        .positions((int) num(row.getCell(6)))
                        .targetDate(targetDate)
                        .status(status)
                        .build();
                jobPostingRepo.save(jp);
                count++;
            }
        }
        return count;
    }

    public byte[] sampleJobsExcel() throws IOException {
        String[] headers = { "Type (JOB/INTERNSHIP)", "Job Role", "Department", "Employment Type", "Work Mode", "Location", "Positions", "Target Date (YYYY-MM-DD)", "Status (DRAFT/PUBLISHED)" };
        Object[][] data = {
            { "JOB",        "Software Engineer",  "Engineering", "Full-time", "Hybrid",  "Bangalore", 5, "2025-09-01", "PUBLISHED" },
            { "JOB",        "Data Analyst",       "Analytics",   "Full-time", "Onsite",  "Hyderabad", 3, "2025-09-15", "DRAFT"     },
            { "INTERNSHIP", "Frontend Intern",    "Engineering", "",          "Remote",  "Mumbai",    2, "2025-08-01", "PUBLISHED" },
        };
        String[] ih = { "Column", "Description" };
        String[][] id = {
            { "Type",              "JOB or INTERNSHIP" },
            { "Job Role",          "Title of the role (required)" },
            { "Department",        "Department name" },
            { "Employment Type",   "Full-time / Part-time / Contract (for JOB)" },
            { "Work Mode",         "Remote / Hybrid / Onsite" },
            { "Location",          "City or location" },
            { "Positions",         "Number of open positions" },
            { "Target Date",       "Application deadline in YYYY-MM-DD format" },
            { "Status",            "DRAFT or PUBLISHED" },
        };
        return buildWorkbook("Jobs", headers, data, ih, id);
    }

    // ── Bulk upload: SMEs ─────────────────────────────────────────────────────
    // Columns: Name | Expertise Areas (comma-sep) | Bio | Available From | Available To | Days (comma-sep) | Mode | Location / Meeting Link

    public int bulkUploadSmes(MultipartFile file, IndustryPartner partner) throws IOException {
        int count = 0;
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String name = str(row.getCell(0));
                if (name.isBlank()) continue;
                String expertiseRaw = str(row.getCell(1));
                String expertiseJson = "[" + splitCsv(expertiseRaw).stream()
                        .map(s -> "\"" + s.replace("\"", "\\\"") + "\"")
                        .reduce((a, b) -> a + "," + b).orElse("") + "]";
                String daysRaw = str(row.getCell(5));
                String daysJson = "[" + splitCsv(daysRaw).stream()
                        .map(s -> "\"" + s.replace("\"", "\\\"") + "\"")
                        .reduce((a, b) -> a + "," + b).orElse("") + "]";
                String fromStr = str(row.getCell(3));
                String toStr   = str(row.getCell(4));
                LocalDate from = null, to = null;
                try { if (!fromStr.isBlank()) from = LocalDate.parse(fromStr); } catch (Exception ignored) {}
                try { if (!toStr.isBlank())   to   = LocalDate.parse(toStr);   } catch (Exception ignored) {}
                String mode = str(row.getCell(6));
                String locOrLink = str(row.getCell(7));
                IndustrySme sme = IndustrySme.builder()
                        .partner(partner)
                        .smeName(name)
                        .expertiseArea(expertiseJson)
                        .bio(str(row.getCell(2)))
                        .availableFrom(from)
                        .availableTo(to)
                        .days(daysJson)
                        .mode(mode)
                        .locationName("Offline".equalsIgnoreCase(mode) || "Both".equalsIgnoreCase(mode) ? locOrLink : null)
                        .meetingLink("Online".equalsIgnoreCase(mode)  || "Both".equalsIgnoreCase(mode) ? locOrLink : null)
                        .status(IndustrySme.Status.PUBLISHED)
                        .build();
                smeRepo.save(sme);
                count++;
            }
        }
        return count;
    }

    public byte[] sampleSmesExcel() throws IOException {
        String[] headers = { "Name", "Expertise Areas (comma-separated)", "Bio", "Available From (YYYY-MM-DD)", "Available To (YYYY-MM-DD)", "Days (comma-separated)", "Mode (Online/Offline/Both)", "Location / Meeting Link" };
        Object[][] data = {
            { "Rajesh Sharma",   "Java, Spring Boot, Microservices", "10+ yrs in backend dev", "2025-08-01", "2025-12-31", "Monday,Wednesday,Friday", "Online",  "https://meet.google.com/abc" },
            { "Priya Nair",      "Data Science, Python, ML",         "ML engineer at TCS",     "2025-09-01", "2025-11-30", "Tuesday,Thursday",        "Offline", "TCS Bangalore Campus" },
            { "Amit Verma",      "UI/UX, Figma, React",              "Product designer 8 yrs", "2025-08-15", "2025-12-15", "Monday,Friday",           "Both",    "https://teams.microsoft.com/xyz" },
        };
        String[] ih = { "Column", "Description" };
        String[][] id = {
            { "Name",              "SME full name (required)" },
            { "Expertise Areas",   "Comma-separated skill areas" },
            { "Bio",               "Short bio / background" },
            { "Available From",    "Start date in YYYY-MM-DD" },
            { "Available To",      "End date in YYYY-MM-DD" },
            { "Days",              "Comma-separated days e.g. Monday,Wednesday" },
            { "Mode",              "Online / Offline / Both" },
            { "Location/Link",     "Meeting link for Online; venue for Offline" },
        };
        return buildWorkbook("SMEs", headers, data, ih, id);
    }

    public byte[] sampleSyllabusExcel() throws IOException {
        String[] headers = {
            "Semester", "Subject Code", "Subject Name",
            "Module No.", "Module Name", "Topics Covered", "Hours",
            "Course Objective", "Expected Outcome"
        };
        Object[][] data = {
            {"Semester 1", "CS101", "Eng. Maths I",            1, "Differential Calculus", "Limits, Derivatives, Chain Rule",       8, "Understand calculus",        "Apply differential calculus"},
            {"Semester 1", "CS101", "Eng. Maths I",            2, "Integral Calculus",     "Definite & Indefinite Integrals",        8, "Apply integration",          "Evaluate integrals"},
            {"Semester 1", "CS102", "Programming Fundamentals",1, "Introduction to C",     "Variables, Data Types, Operators, I/O", 6, "Introduce programming",      "Write simple C programs"},
            {"Semester 1", "CS102", "Programming Fundamentals",2, "Control Structures",    "if-else, switch, loops, break",          6, "Understand control flow",    "Implement decision-making code"},
        };
        String[] ih = {"Column", "Description"};
        String[][] id = {
            {"Semester",          "Semester name"},
            {"Subject Code",      "Matches code in Credit Structure sheet"},
            {"Module No.",        "Sequential module number within subject"},
            {"Module Name",       "Module title"},
            {"Topics Covered",    "Comma-separated topics for this module"},
            {"Hours",             "Teaching hours allocated to this module"},
            {"Course Objective",  "What the module aims to achieve"},
            {"Expected Outcome",  "What students should be able to do after"},
        };
        return buildWorkbook("Syllabus", headers, data, ih, id);
    }
}
