package com.hubblehox.e2j.config;

import com.hubblehox.e2j.entity.PsychometricQuestion;
import com.hubblehox.e2j.repository.PsychometricQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PsychometricDataSeeder implements ApplicationRunner {

    private final PsychometricQuestionRepository repo;

    @Override
    public void run(ApplicationArguments args) {
        if (repo.count() > 0) return; // already seeded

        List<PsychometricQuestion> questions = List.of(

            // ── TECH ── R (Realistic)
            q("I enjoy building or assembling hardware components and physical systems.", "R", "TECH", 1),
            q("I prefer hands-on coding projects over reading documentation or theory.", "R", "TECH", 2),
            q("I like debugging and fixing technical problems by trial and error.", "R", "TECH", 3),
            q("I enjoy setting up servers, networks, or infrastructure.", "R", "TECH", 4),
            q("I prefer working on concrete problems that have clear technical solutions.", "R", "TECH", 5),

            // TECH – I (Investigative)
            q("I enjoy researching algorithms and finding optimal solutions to complex problems.", "I", "TECH", 6),
            q("I like analysing data sets to identify patterns and insights.", "I", "TECH", 7),
            q("I enjoy writing code that automates or solves intellectual challenges.", "I", "TECH", 8),
            q("I like exploring new technologies and understanding how they work internally.", "I", "TECH", 9),
            q("I find satisfaction in solving complex system design or architecture problems.", "I", "TECH", 10),

            // TECH – A (Artistic)
            q("I enjoy designing user interfaces that are both functional and visually appealing.", "A", "TECH", 11),
            q("I like creating prototypes and exploring creative solutions to technical problems.", "A", "TECH", 12),
            q("I enjoy working on the visual and interactive aspects of software products.", "A", "TECH", 13),
            q("I like experimenting with design patterns and unconventional approaches in coding.", "A", "TECH", 14),
            q("I find building games or creative digital experiences more exciting than routine tasks.", "A", "TECH", 15),

            // TECH – S (Social)
            q("I enjoy explaining technical concepts to non-technical team members.", "S", "TECH", 16),
            q("I like collaborating in agile or scrum teams to deliver software.", "S", "TECH", 17),
            q("I enjoy mentoring junior developers or conducting code reviews.", "S", "TECH", 18),
            q("I prefer pair programming or collaborative problem-solving over working alone.", "S", "TECH", 19),
            q("I like understanding user needs and translating them into technical requirements.", "S", "TECH", 20),

            // TECH – E (Enterprising)
            q("I enjoy leading a development team or managing a technical project.", "E", "TECH", 21),
            q("I like presenting technical solutions or demos to clients or stakeholders.", "E", "TECH", 22),
            q("I am drawn to startup environments where I can own and drive features end-to-end.", "E", "TECH", 23),
            q("I enjoy making strategic technology decisions that impact the business.", "E", "TECH", 24),
            q("I like identifying opportunities to use technology to generate business value.", "E", "TECH", 25),

            // TECH – C (Conventional)
            q("I enjoy writing thorough documentation and following coding standards.", "C", "TECH", 26),
            q("I like working in structured environments with clear processes and procedures.", "C", "TECH", 27),
            q("I prefer maintaining and improving existing systems over building from scratch.", "C", "TECH", 28),
            q("I enjoy testing software systematically to ensure everything works correctly.", "C", "TECH", 29),
            q("I like working with well-defined specifications and predictable tasks.", "C", "TECH", 30),

            // ── COMMERCE ── R
            q("I enjoy handling physical products, inventory, or supply chain operations.", "R", "COMMERCE", 1),
            q("I like working with tangible business assets like property or equipment.", "R", "COMMERCE", 2),
            q("I prefer practical, hands-on business operations over theoretical strategy.", "R", "COMMERCE", 3),
            q("I enjoy managing logistics, distribution, or operations on the ground.", "R", "COMMERCE", 4),
            q("I find satisfaction in optimising physical workflows and business processes.", "R", "COMMERCE", 5),

            // COMMERCE – I
            q("I enjoy analysing financial statements and identifying business trends.", "I", "COMMERCE", 6),
            q("I like researching markets and evaluating investment opportunities.", "I", "COMMERCE", 7),
            q("I enjoy solving complex financial or strategic business problems.", "I", "COMMERCE", 8),
            q("I like using data and research to make informed business decisions.", "I", "COMMERCE", 9),
            q("I find economics, business models, and market dynamics intellectually stimulating.", "I", "COMMERCE", 10),

            // COMMERCE – A
            q("I enjoy developing creative marketing campaigns and brand strategies.", "A", "COMMERCE", 11),
            q("I like crafting compelling business proposals and presentations.", "A", "COMMERCE", 12),
            q("I enjoy designing innovative business models or new product concepts.", "A", "COMMERCE", 13),
            q("I like finding creative ways to solve business challenges.", "A", "COMMERCE", 14),
            q("I enjoy expressing ideas through storytelling, visuals, or content creation.", "A", "COMMERCE", 15),

            // COMMERCE – S
            q("I enjoy building client relationships and providing customer solutions.", "S", "COMMERCE", 16),
            q("I like training teams and helping employees develop their skills.", "S", "COMMERCE", 17),
            q("I prefer working in customer-facing roles rather than back-office functions.", "S", "COMMERCE", 18),
            q("I enjoy negotiating and finding mutually beneficial agreements.", "S", "COMMERCE", 19),
            q("I find coaching and mentoring others professionally rewarding.", "S", "COMMERCE", 20),

            // COMMERCE – E
            q("I enjoy leading sales teams and driving revenue growth.", "E", "COMMERCE", 21),
            q("I like setting business goals and motivating teams to achieve them.", "E", "COMMERCE", 22),
            q("I am drawn to entrepreneurial opportunities and starting new ventures.", "E", "COMMERCE", 23),
            q("I enjoy pitching business ideas to investors or senior management.", "E", "COMMERCE", 24),
            q("I like making high-stakes decisions that affect the direction of a business.", "E", "COMMERCE", 25),

            // COMMERCE – C
            q("I enjoy maintaining accurate financial records and ensuring compliance.", "C", "COMMERCE", 26),
            q("I like working with structured data, spreadsheets, and reports.", "C", "COMMERCE", 27),
            q("I prefer well-defined processes and established business procedures.", "C", "COMMERCE", 28),
            q("I enjoy auditing accounts and ensuring financial accuracy.", "C", "COMMERCE", 29),
            q("I like organising information systematically and maintaining detailed records.", "C", "COMMERCE", 30),

            // ── ARTS ── R
            q("I enjoy creating physical art, sculptures, or handcrafted objects.", "R", "ARTS", 1),
            q("I like working with materials like clay, fabric, wood, or paint.", "R", "ARTS", 2),
            q("I prefer making tangible creative works over purely digital ones.", "R", "ARTS", 3),
            q("I enjoy photography, filmmaking, or capturing real-world moments.", "R", "ARTS", 4),
            q("I like building sets, stage designs, or physical installations.", "R", "ARTS", 5),

            // ARTS – I
            q("I enjoy researching cultural history and analysing artistic movements.", "I", "ARTS", 6),
            q("I like studying the psychological impact of art, music, or literature.", "I", "ARTS", 7),
            q("I enjoy writing analytical essays or critiques about creative works.", "I", "ARTS", 8),
            q("I find exploring philosophical questions through creative expression stimulating.", "I", "ARTS", 9),
            q("I like understanding the theory and technique behind great works of art.", "I", "ARTS", 10),

            // ARTS – A
            q("I enjoy creating original content — writing, music, design, or visual art.", "A", "ARTS", 11),
            q("I like experimenting with new styles and unconventional creative approaches.", "A", "ARTS", 12),
            q("I find creative self-expression through art, performance, or storytelling fulfilling.", "A", "ARTS", 13),
            q("I enjoy developing my own unique creative voice or artistic identity.", "A", "ARTS", 14),
            q("I like working on imaginative projects with few constraints or boundaries.", "A", "ARTS", 15),

            // ARTS – S
            q("I enjoy teaching art, music, or creative skills to others.", "S", "ARTS", 16),
            q("I like collaborating with other artists or creatives on joint projects.", "S", "ARTS", 17),
            q("I enjoy using my creative work to connect with audiences emotionally.", "S", "ARTS", 18),
            q("I like organising community events, exhibitions, or performances.", "S", "ARTS", 19),
            q("I prefer working in creative teams over working alone on projects.", "S", "ARTS", 20),

            // ARTS – E
            q("I enjoy managing creative projects and leading a team of artists.", "E", "ARTS", 21),
            q("I like pitching creative concepts to clients, galleries, or media companies.", "E", "ARTS", 22),
            q("I am drawn to building a creative brand or business around my work.", "E", "ARTS", 23),
            q("I enjoy identifying commercial opportunities for my creative skills.", "E", "ARTS", 24),
            q("I like being the creative director who drives the vision for a project.", "E", "ARTS", 25),

            // ARTS – C
            q("I enjoy carefully editing, refining, and perfecting my creative work.", "C", "ARTS", 26),
            q("I like organising portfolios, archives, or collections of creative work.", "C", "ARTS", 27),
            q("I prefer structured creative briefs with clear guidelines over open-ended briefs.", "C", "ARTS", 28),
            q("I enjoy proofreading, fact-checking, or quality reviewing creative content.", "C", "ARTS", 29),
            q("I like maintaining consistency in style, format, and presentation.", "C", "ARTS", 30),

            // ── GENERAL ── R
            q("I enjoy working with my hands to fix, build, or assemble things.", "R", "GENERAL", 1),
            q("I prefer practical activities over abstract or theoretical discussions.", "R", "GENERAL", 2),
            q("I like outdoor work or activities that involve physical effort.", "R", "GENERAL", 3),
            q("I enjoy mechanical or technical tasks that produce visible results.", "R", "GENERAL", 4),
            q("I like solving problems by taking direct, action-oriented approaches.", "R", "GENERAL", 5),

            // GENERAL – I
            q("I enjoy reading, researching, and learning about complex topics.", "I", "GENERAL", 6),
            q("I like solving puzzles, riddles, or analytical challenges.", "I", "GENERAL", 7),
            q("I enjoy asking 'why' and exploring the root causes of problems.", "I", "GENERAL", 8),
            q("I like conducting experiments or testing hypotheses to find answers.", "I", "GENERAL", 9),
            q("I find intellectual discussions and debates stimulating and energising.", "I", "GENERAL", 10),

            // GENERAL – A
            q("I enjoy expressing myself through writing, music, art, or design.", "A", "GENERAL", 11),
            q("I like coming up with creative ideas and thinking outside the box.", "A", "GENERAL", 12),
            q("I prefer working in environments that encourage innovation and imagination.", "A", "GENERAL", 13),
            q("I enjoy telling stories or communicating ideas in engaging, original ways.", "A", "GENERAL", 14),
            q("I find routine and repetitive tasks unstimulating.", "A", "GENERAL", 15),

            // GENERAL – S
            q("I enjoy helping others solve their problems or navigate challenges.", "S", "GENERAL", 16),
            q("I like working in teams and building relationships with colleagues.", "S", "GENERAL", 17),
            q("I enjoy volunteering, community service, or social impact work.", "S", "GENERAL", 18),
            q("I prefer careers that directly benefit individuals or communities.", "S", "GENERAL", 19),
            q("I like listening to others and providing support or advice.", "S", "GENERAL", 20),

            // GENERAL – E
            q("I enjoy leading groups and taking charge of situations.", "E", "GENERAL", 21),
            q("I like persuading others and negotiating to achieve goals.", "E", "GENERAL", 22),
            q("I am motivated by competition and achieving ambitious targets.", "E", "GENERAL", 23),
            q("I enjoy starting new initiatives and taking calculated risks.", "E", "GENERAL", 24),
            q("I like influencing decisions and being seen as a leader by others.", "E", "GENERAL", 25),

            // GENERAL – C
            q("I enjoy organising information and keeping detailed records.", "C", "GENERAL", 26),
            q("I like following established rules, procedures, and standards.", "C", "GENERAL", 27),
            q("I prefer structured environments where expectations are clear.", "C", "GENERAL", 28),
            q("I enjoy checking work carefully to ensure accuracy and completeness.", "C", "GENERAL", 29),
            q("I like tasks that involve planning, scheduling, and systematic execution.", "C", "GENERAL", 30)
        );

        repo.saveAll(questions);
    }

    private PsychometricQuestion q(String text, String category, String profileType, int order) {
        return PsychometricQuestion.builder()
            .questionText(text)
            .category(category)
            .profileType(profileType)
            .orderIndex(order)
            .active(true)
            .build();
    }
}
