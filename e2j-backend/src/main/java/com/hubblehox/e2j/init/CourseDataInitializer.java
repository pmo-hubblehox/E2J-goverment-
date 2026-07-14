package com.hubblehox.e2j.init;

import com.hubblehox.e2j.entity.Course;
import com.hubblehox.e2j.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CourseDataInitializer implements ApplicationRunner {

    private final CourseRepository courseRepo;

    private static final String ITI_CATEGORY = "Vocational Trades";

    @Override
    public void run(ApplicationArguments args) {
        if (courseRepo.count() == 0) courseRepo.saveAll(baseCourses());
        if (!courseRepo.existsByCategory(ITI_CATEGORY)) courseRepo.saveAll(itiCourses());
    }

    private List<Course> baseCourses() {
        return List.of(

            // ── Project Management / Leadership ──────────────────────────────
            Course.builder()
                .title("PMP Certification: Project Management Professional")
                .instructor("Ramesh Iyer").rating(4.9).studentCount(18400).duration("45h").price(3999L)
                .type(Course.CourseType.EXTERNAL).category("Project Management")
                .skills(List.of("Project Management", "PMP", "Risk Management", "Stakeholder Management", "WBS"))
                .targetRoles(List.of("Project Manager", "Program Manager", "Team Lead", "Delivery Manager"))
                .build(),

            Course.builder()
                .title("Agile & Scrum Master Certification Prep")
                .instructor("Anita Desai").rating(4.8).studentCount(14200).duration("28h").price(2499L)
                .type(Course.CourseType.EXTERNAL).category("Project Management")
                .skills(List.of("Agile", "Scrum", "Sprint Planning", "Kanban", "Retrospectives"))
                .targetRoles(List.of("Scrum Master", "Team Lead", "Project Manager", "Product Owner"))
                .build(),

            Course.builder()
                .title("Team Leadership & People Management")
                .instructor("Vikram Nair").rating(4.7).studentCount(9800).duration("20h").price(1999L)
                .type(Course.CourseType.INSTITUTE).category("Leadership")
                .skills(List.of("Leadership", "Team Management", "Communication", "Conflict Resolution", "Mentoring"))
                .targetRoles(List.of("Team Lead", "Manager", "Project Manager", "HR Manager", "Director"))
                .build(),

            Course.builder()
                .title("Strategic Thinking & Decision Making for Leaders")
                .instructor("Priya Menon").rating(4.6).studentCount(6700).duration("16h").price(1499L)
                .type(Course.CourseType.INSTITUTE).category("Leadership")
                .skills(List.of("Strategic Planning", "Decision Making", "Leadership", "OKR", "Business Strategy"))
                .targetRoles(List.of("Team Lead", "Manager", "Director", "CEO", "Product Manager"))
                .build(),

            Course.builder()
                .title("JIRA & Confluence for Project Teams")
                .instructor("Suresh Pillai").rating(4.5).studentCount(7300).duration("12h").price(null)
                .type(Course.CourseType.EXTERNAL).category("Project Management")
                .skills(List.of("JIRA", "Confluence", "Agile", "Project Management", "Sprint Planning"))
                .targetRoles(List.of("Project Manager", "Scrum Master", "Team Lead", "Business Analyst"))
                .build(),

            // ── Data Science / Analytics ─────────────────────────────────────
            Course.builder()
                .title("Data Science & Machine Learning Bootcamp")
                .instructor("Priya Sharma").rating(4.8).studentCount(21000).duration("60h").price(4999L)
                .type(Course.CourseType.EXTERNAL).category("Data Science")
                .skills(List.of("Python", "Machine Learning", "Pandas", "Scikit-learn", "Data Visualization"))
                .targetRoles(List.of("Data Scientist", "ML Engineer", "Data Analyst", "AI Engineer"))
                .build(),

            Course.builder()
                .title("Business Analytics & Power BI")
                .instructor("Sunita Rao").rating(4.6).studentCount(8900).duration("22h").price(null)
                .type(Course.CourseType.INSTITUTE).category("Analytics")
                .skills(List.of("Power BI", "Business Analytics", "SQL", "Excel", "Data Visualization"))
                .targetRoles(List.of("Business Analyst", "Data Analyst", "Product Manager", "Consultant"))
                .build(),

            Course.builder()
                .title("SQL for Data Analysis – Beginner to Advanced")
                .instructor("Kiran Bhat").rating(4.7).studentCount(15600).duration("18h").price(999L)
                .type(Course.CourseType.INSTITUTE).category("Data Science")
                .skills(List.of("SQL", "Data Analysis", "Database", "PostgreSQL", "Query Optimization"))
                .targetRoles(List.of("Data Analyst", "Backend Developer", "Business Analyst", "DBA"))
                .build(),

            // ── Software Development ─────────────────────────────────────────
            Course.builder()
                .title("Complete Java Programming Masterclass")
                .instructor("Dr. Ravi Kumar").rating(4.9).studentCount(24000).duration("55h").price(null)
                .type(Course.CourseType.INSTITUTE).category("Backend Development")
                .skills(List.of("Java", "OOP", "Spring Boot", "Hibernate", "REST API"))
                .targetRoles(List.of("Backend Developer", "Java Developer", "Fullstack Developer", "Software Engineer"))
                .build(),

            Course.builder()
                .title("React & TypeScript – Complete Frontend Developer")
                .instructor("Neha Gupta").rating(4.9).studentCount(19500).duration("52h").price(null)
                .type(Course.CourseType.INSTITUTE).category("Frontend Development")
                .skills(List.of("React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind"))
                .targetRoles(List.of("Frontend Developer", "Fullstack Developer", "UI Developer", "Software Engineer"))
                .build(),

            Course.builder()
                .title("Node.js & Express – Backend API Development")
                .instructor("Arjun Shah").rating(4.6).studentCount(11200).duration("35h").price(2499L)
                .type(Course.CourseType.EXTERNAL).category("Backend Development")
                .skills(List.of("Node.js", "Express", "REST API", "MongoDB", "JavaScript"))
                .targetRoles(List.of("Backend Developer", "Fullstack Developer", "API Developer"))
                .build(),

            Course.builder()
                .title("System Design: From Junior to Senior Engineer")
                .instructor("Kavya Reddy").rating(4.8).studentCount(13400).duration("24h").price(3499L)
                .type(Course.CourseType.EXTERNAL).category("Backend Development")
                .skills(List.of("System Design", "Architecture", "Scalability", "Microservices", "Load Balancing"))
                .targetRoles(List.of("Software Engineer", "Backend Developer", "Architect", "Technical Lead"))
                .build(),

            // ── Cloud & DevOps ───────────────────────────────────────────────
            Course.builder()
                .title("AWS Certified Solutions Architect – Associate")
                .instructor("Amit Patel").rating(4.7).studentCount(16800).duration("40h").price(4499L)
                .type(Course.CourseType.EXTERNAL).category("Cloud")
                .skills(List.of("AWS", "Cloud Computing", "EC2", "S3", "Lambda", "IAM"))
                .targetRoles(List.of("Cloud Engineer", "DevOps Engineer", "Solutions Architect", "Backend Developer"))
                .build(),

            Course.builder()
                .title("Docker & Kubernetes for DevOps Engineers")
                .instructor("Rohit Joshi").rating(4.7).studentCount(10300).duration("32h").price(2999L)
                .type(Course.CourseType.EXTERNAL).category("DevOps")
                .skills(List.of("Docker", "Kubernetes", "CI/CD", "DevOps", "Terraform"))
                .targetRoles(List.of("DevOps Engineer", "Cloud Engineer", "Platform Engineer", "SRE"))
                .build(),

            // ── UI/UX Design ─────────────────────────────────────────────────
            Course.builder()
                .title("UI/UX Design Bootcamp – Figma to Prototype")
                .instructor("Meera Krishnan").rating(4.8).studentCount(12100).duration("38h").price(3499L)
                .type(Course.CourseType.EXTERNAL).category("Design")
                .skills(List.of("Figma", "UI Design", "UX Research", "Wireframing", "Prototyping"))
                .targetRoles(List.of("UI/UX Designer", "Product Designer", "Frontend Developer", "Product Manager"))
                .build(),

            // ── Product Management ───────────────────────────────────────────
            Course.builder()
                .title("Product Management Fundamentals")
                .instructor("Deepa Nambiar").rating(4.7).studentCount(9400).duration("25h").price(2999L)
                .type(Course.CourseType.EXTERNAL).category("Product")
                .skills(List.of("Product Management", "Roadmap", "User Stories", "A/B Testing", "Go-to-Market"))
                .targetRoles(List.of("Product Manager", "Product Owner", "Business Analyst", "Project Manager"))
                .build(),

            Course.builder()
                .title("Growth Hacking & Digital Marketing for Product Teams")
                .instructor("Nikhil Sood").rating(4.5).studentCount(5600).duration("18h").price(1999L)
                .type(Course.CourseType.INSTITUTE).category("Product")
                .skills(List.of("Growth Hacking", "Digital Marketing", "SEO", "Analytics", "Product Strategy"))
                .targetRoles(List.of("Product Manager", "Marketing Manager", "Business Analyst", "Growth Manager"))
                .build(),

            // ── Cybersecurity ────────────────────────────────────────────────
            Course.builder()
                .title("Ethical Hacking & Cybersecurity Fundamentals")
                .instructor("Rajesh Nair").rating(4.7).studentCount(8700).duration("42h").price(3999L)
                .type(Course.CourseType.EXTERNAL).category("Cybersecurity")
                .skills(List.of("Ethical Hacking", "Cybersecurity", "Penetration Testing", "Network Security", "OWASP"))
                .targetRoles(List.of("Cybersecurity Analyst", "Penetration Tester", "Security Engineer", "Network Engineer"))
                .build(),

            // ── Soft Skills / Communication ──────────────────────────────────
            Course.builder()
                .title("Business Communication & Presentation Skills")
                .instructor("Shilpa Verma").rating(4.4).studentCount(4200).duration("10h").price(null)
                .type(Course.CourseType.INSTITUTE).category("Soft Skills")
                .skills(List.of("Communication", "Presentation", "Public Speaking", "Email Writing", "Negotiation"))
                .targetRoles(List.of("Manager", "Team Lead", "Business Analyst", "HR Manager", "Consultant"))
                .build(),

            // ── Finance / MBA ────────────────────────────────────────────────
            Course.builder()
                .title("Financial Modeling & Valuation – Investment Banking")
                .instructor("Gaurav Chopra").rating(4.6).studentCount(6300).duration("30h").price(4999L)
                .type(Course.CourseType.EXTERNAL).category("Finance")
                .skills(List.of("Financial Modeling", "Excel", "Valuation", "DCF", "Investment Banking"))
                .targetRoles(List.of("Financial Analyst", "Investment Banker", "Business Analyst", "CFO"))
                .build(),

            // ── HR & Operations ──────────────────────────────────────────────
            Course.builder()
                .title("HR Management & Talent Acquisition")
                .instructor("Pooja Kapoor").rating(4.4).studentCount(3800).duration("15h").price(1499L)
                .type(Course.CourseType.INSTITUTE).category("HR")
                .skills(List.of("HR Management", "Recruitment", "Performance Management", "Employee Engagement", "HRMS"))
                .targetRoles(List.of("HR Manager", "Talent Acquisition", "HR Business Partner", "People Manager"))
                .build(),

            Course.builder()
                .title("Operations Management & Process Improvement")
                .instructor("Sanjay Mehta").rating(4.5).studentCount(5100).duration("20h").price(1999L)
                .type(Course.CourseType.INSTITUTE).category("Operations")
                .skills(List.of("Operations Management", "Lean", "Six Sigma", "Process Improvement", "Supply Chain"))
                .targetRoles(List.of("Operations Manager", "Process Engineer", "Project Manager", "Delivery Manager"))
                .build(),

            // ── AI & Emerging Tech ───────────────────────────────────────────
            Course.builder()
                .title("Generative AI & Prompt Engineering for Professionals")
                .instructor("Dr. Aisha Khan").rating(4.8).studentCount(22000).duration("15h").price(null)
                .type(Course.CourseType.EXTERNAL).category("AI")
                .skills(List.of("Generative AI", "Prompt Engineering", "ChatGPT", "LLM", "AI Tools"))
                .targetRoles(List.of("Product Manager", "Business Analyst", "Content Creator", "Software Engineer", "Consultant"))
                .build(),

            Course.builder()
                .title("Machine Learning Engineering with Python & TensorFlow")
                .instructor("Siddharth Iyer").rating(4.7).studentCount(9100).duration("50h").price(4499L)
                .type(Course.CourseType.EXTERNAL).category("AI")
                .skills(List.of("Machine Learning", "TensorFlow", "Python", "Deep Learning", "Neural Networks"))
                .targetRoles(List.of("ML Engineer", "AI Engineer", "Data Scientist", "Research Engineer"))
                .build()
        );
    }

    private List<Course> itiCourses() {
        return List.of(

            Course.builder()
                .title("EV Battery & Motor Servicing Fundamentals")
                .instructor("Karan Vora").rating(4.6).studentCount(2100).duration("60h").price(2199L)
                .type(Course.CourseType.EXTERNAL).category(ITI_CATEGORY)
                .skills(List.of("EV Battery Diagnostics", "Motor Servicing", "Charging Systems", "EV Safety"))
                .targetRoles(List.of("EV Mechanic", "EV Battery Technician"))
                .build(),

            Course.builder()
                .title("EV Charging Infrastructure & Station Maintenance")
                .instructor("Priya Nair").rating(4.5).studentCount(1400).duration("45h").price(1899L)
                .type(Course.CourseType.EXTERNAL).category(ITI_CATEGORY)
                .skills(List.of("Charging Station Installation", "Fault Diagnosis", "Electrical Safety", "Grid Integration Basics"))
                .targetRoles(List.of("EV Charging Station Technician", "Automotive Electrician"))
                .build(),

            Course.builder()
                .title("Automotive Electrical Systems for EVs")
                .instructor("Rajendra Pawar").rating(4.5).studentCount(1900).duration("70h").price(1599L)
                .type(Course.CourseType.EXTERNAL).category(ITI_CATEGORY)
                .skills(List.of("Wiring", "Circuit Testing", "High-Voltage Safety", "Battery Management Systems"))
                .targetRoles(List.of("Automotive Electrician", "EV Mechanic"))
                .build(),

            Course.builder()
                .title("EV Industrial Safety & High-Voltage PPE")
                .instructor("Meera Kulkarni").rating(4.7).studentCount(3100).duration("12h").price(null)
                .type(Course.CourseType.INSTITUTE).category(ITI_CATEGORY)
                .skills(List.of("Workplace Safety", "High-Voltage PPE", "Hazard Identification", "First Aid Basics"))
                .targetRoles(List.of("EV Mechanic", "EV Battery Technician", "EV Charging Station Technician", "Automotive Electrician"))
                .build()
        );
    }
}
