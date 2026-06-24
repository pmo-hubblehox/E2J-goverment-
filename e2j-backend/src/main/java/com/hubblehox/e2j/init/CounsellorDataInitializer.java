package com.hubblehox.e2j.init;

import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Order(3)
@RequiredArgsConstructor
public class CounsellorDataInitializer implements ApplicationRunner {

    private final UserRepository userRepo;
    private final CounsellorRepository counsellorRepo;
    private final CounsellorEducationRepository educationRepo;
    private final CounsellorWorkExperienceRepository workExpRepo;
    private final CounsellorCertificationRepository certRepo;
    private final CounsellorSessionRepository sessionRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        boolean alreadySeeded = userRepo.findByEmail("priya.sharma@hubblehox.com")
                .flatMap(counsellorRepo::findByUser).isPresent();
        if (alreadySeeded) return;

        seedCounsellor(
            "priya.sharma@hubblehox.com", "Counsellor123@", "Dr. Priya Sharma",
            "Career Development & Soft Skills", "F", 12, 0,
            List.of("Career Counselling", "Soft Skills", "Resume Building", "Interview Prep", "Leadership"),
            "https://www.linkedin.com/in/priya-sharma-demo",
            "Mumbai", "Maharashtra",
            List.of(
                new EduRow("Ph.D. in Psychology", "University of Mumbai", "Counselling Psychology", "2012"),
                new EduRow("M.A. Psychology", "University of Mumbai", "Clinical Psychology", "2008")
            ),
            List.of(
                new WorkRow("TCS – Tata Consultancy Services", "Full-time", "2018-01", null, true,
                    "Lead career counsellor for 5000+ employees. Conduct group workshops on professional development and individual 1-on-1 coaching sessions."),
                new WorkRow("Infosys", "Full-time", "2014-06", "2017-12", false,
                    "Managed campus recruitment and student counselling programs across 10 tier-1 colleges.")
            ),
            List.of(
                new CertRow("ICF-ACC-2019", "ICF Accredited Career Coach (ACC)", "International Coach Federation", "2026-12"),
                new CertRow("SHRM-CP-2020", "SHRM Certified Professional", "SHRM", "2025-12")
            ),
            1500.0, "per session",
            "2026-06-23", "2026-09-30", 14,
            List.of("MON", "WED", "FRI"),
            List.of("10:00 AM", "12:00 PM", "03:00 PM", "05:00 PM")
        );

        seedCounsellor(
            "rajesh.kumar@hubblehox.com", "Counsellor123@", "Rajesh Kumar",
            "Technical Mentoring & Placement", "M", 8, 6,
            List.of("Java", "Spring Boot", "System Design", "DSA", "Technical Interview Prep"),
            "https://www.linkedin.com/in/rajesh-kumar-demo",
            "Bengaluru", "Karnataka",
            List.of(
                new EduRow("B.Tech Computer Science", "IIT Bombay", "Computer Science", "2015"),
                new EduRow("M.Tech", "IIT Bombay", "Software Engineering", "2017")
            ),
            List.of(
                new WorkRow("Google India", "Full-time", "2020-03", null, true,
                    "Senior Software Engineer working on distributed systems. Mentors junior engineers through the STEP internship program."),
                new WorkRow("Flipkart", "Full-time", "2017-07", "2020-02", false,
                    "Backend engineer on the payments platform. Led a team of 4 engineers.")
            ),
            List.of(
                new CertRow("GCPDE-2022", "Google Cloud Professional Data Engineer", "Google", "2024-06"),
                new CertRow("AWS-SAA-2021", "AWS Solutions Architect Associate", "Amazon Web Services", "2024-01")
            ),
            999.0, "per session",
            "2026-06-23", "2026-09-30", 14,
            List.of("TUE", "THU", "SAT"),
            List.of("09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM")
        );

        seedCounsellor(
            "sunita.patel@hubblehox.com", "Counsellor123@", "Sunita Patel",
            "HR & Corporate Readiness", "F", 10, 3,
            List.of("HR Consulting", "Corporate Readiness", "Behavioral Interviews", "LinkedIn Optimization", "Salary Negotiation"),
            "https://www.linkedin.com/in/sunita-patel-demo",
            "Pune", "Maharashtra",
            List.of(
                new EduRow("MBA Human Resources", "Symbiosis Institute of Business Management", "Human Resources", "2014"),
                new EduRow("B.Com", "Pune University", "Commerce", "2012")
            ),
            List.of(
                new WorkRow("Wipro Technologies", "Full-time", "2019-01", null, true,
                    "Head of Campus Hiring. Manages end-to-end recruitment for 2000+ campus hires annually across India."),
                new WorkRow("Deloitte India", "Full-time", "2014-07", "2018-12", false,
                    "HR Business Partner for the technology consulting division.")
            ),
            List.of(
                new CertRow("HRCI-PHR-2019", "Professional in Human Resources (PHR)", "HRCI", "2025-06"),
                new CertRow("DISC-2020", "DISC Certified Practitioner", "Extended DISC", "2025-01")
            ),
            1200.0, "per session",
            "2026-06-23", "2026-09-30", 14,
            List.of("MON", "TUE", "WED", "THU"),
            List.of("10:00 AM", "01:00 PM", "04:00 PM")
        );

        log.info("Seeded 3 test counsellors");
    }

    private void seedCounsellor(
            String email, String password, String name,
            String specialty, String gender, int expYears, int expMonths,
            List<String> skills, String linkedinUrl, String city, String state,
            List<EduRow> edus, List<WorkRow> works, List<CertRow> certs,
            Double fee, String feeType,
            String dateFrom, String dateTo, int recurWeeks,
            List<String> days, List<String> timeSlots) {

        User user = userRepo.findByEmail(email).orElseGet(() ->
                User.builder().email(email).name(name).role(User.Role.COUNSELLOR).build());
        user.setPassword(passwordEncoder.encode(password));
        user.setEnabled(true);
        user = userRepo.save(user);

        if (counsellorRepo.findByUser(user).isPresent()) return;

        Counsellor c = Counsellor.builder()
                .user(user)
                .gender(gender)
                .city(city)
                .state(state)
                .experienceCategory(specialty)
                .experienceYears(expYears)
                .experienceMonths(expMonths)
                .skills(skills)
                .linkedinUrl(linkedinUrl)
                .onboardingCompleted(true)
                .status(Counsellor.Status.APPROVED)
                .build();
        c = counsellorRepo.save(c);

        for (EduRow e : edus) {
            educationRepo.save(CounsellorEducation.builder()
                    .counsellor(c).degree(e.degree).schoolName(e.school)
                    .major(e.major).yearOfPassing(e.year).build());
        }
        for (WorkRow w : works) {
            workExpRepo.save(CounsellorWorkExperience.builder()
                    .counsellor(c).companyName(w.company).employmentType(w.type)
                    .fromDate(w.from).toDate(w.to).currentlyWorking(w.current)
                    .description(w.desc).build());
        }
        for (CertRow cr : certs) {
            certRepo.save(CounsellorCertification.builder()
                    .counsellor(c).certificateId(cr.id).certificateName(cr.name)
                    .awardingInstitute(cr.institute).validTill(cr.validTill).build());
        }

        sessionRepo.save(CounsellorSession.builder()
                .counsellor(c).dateFrom(dateFrom).dateTo(dateTo)
                .recurWeeks(recurWeeks).days(days).timeSlots(timeSlots)
                .feeAmount(fee).feeType(feeType)
                .status(CounsellorSession.Status.AVAILABLE).build());
    }

    record EduRow(String degree, String school, String major, String year) {}
    record WorkRow(String company, String type, String from, String to, boolean current, String desc) {}
    record CertRow(String id, String name, String institute, String validTill) {}
}
