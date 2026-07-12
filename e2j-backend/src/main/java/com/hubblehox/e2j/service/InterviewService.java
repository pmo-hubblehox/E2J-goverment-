package com.hubblehox.e2j.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hubblehox.e2j.dto.InterviewDto;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.entity.InterviewSession.SessionStatus;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewSessionRepository sessionRepo;
    private final InterviewQuestionRepository questionRepo;
    private final StudentRepository studentRepo;
    private final StudentProfileRepository profileRepo;
    private final StudentAspirationRepository aspirationRepo;
    private final UserRepository userRepo;
    private final GroqService groq;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, List<InterviewDto.McqQuestion>> mcqQuizStore = new ConcurrentHashMap<>();

    /* ── helpers ── */
    private Student getStudent(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return studentRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    private String buildSystemPrompt(String role, String experienceLevel, String skills, String language, Integer difficultyLevel) {
        String langInstruction = (language != null && !language.equalsIgnoreCase("English"))
                ? "IMPORTANT: Conduct the ENTIRE interview in " + language + ". Ask all questions and give all feedback in " + language + " only. Use professional, clear " + language + "."
                : "Conduct the interview in English.";

        int level = difficultyLevel != null ? difficultyLevel : 5;
        String difficultyInstruction = """
                DIFFICULTY LEVEL: %d/10 (calibrated from the candidate's pre-interview quiz score).
                - 1-3: ask foundational, easy questions — build confidence.
                - 4-6: ask standard practical questions at expected competency level.
                - 7-10: ask advanced, nuanced questions that probe edge cases and deep understanding.
                Calibrate the complexity of EVERY question (not just topic) to this level.
                """.formatted(level);

        return """
                You are an experienced technical interviewer conducting a real job interview.

                %s

                %s

                CANDIDATE PROFILE:
                - Target Role: %s
                - Experience Level: %s
                - Skills: %s

                YOUR TASK:
                Conduct a focused 15-minute interview covering exactly these 5 areas in order.
                Ask EXACTLY 2-3 questions per area (no more), then move to the next area.
                Total questions: 10-15 maximum.

                AREAS (use these exact keys in topicArea field):
                1. INTRODUCTION     - 2-3 warm, easy questions: who they are, background, why this role
                2. TECHNICAL_SKILLS - 2-3 questions on core technical knowledge for %s
                3. BEHAVIOURAL      - 2-3 questions on past experiences, teamwork, handling challenges
                4. PROBLEM_SOLVING  - 2-3 situational questions: how they handle hypothetical scenarios
                5. DOMAIN_KNOWLEDGE - 2-3 deep domain expertise questions specific to %s

                SCORING RULES:
                - If the student did not answer or said nothing meaningful: score 1
                - Score 1-4: poor answer — ask ONE follow-up in the same area then move on
                - Score 5-6: average — move to next question
                - Score 7-10: good — move to next question or next area
                - After 2-3 questions in an area, ALWAYS move to the next area regardless of score
                - Set isComplete to true after all 5 areas are covered OR after 15 questions

                ALWAYS respond in this exact JSON format (field names always in English, values in the interview language):
                {
                  "questionText": "Your next interview question here",
                  "topicArea": "INTRODUCTION|TECHNICAL_SKILLS|BEHAVIOURAL|PROBLEM_SOLVING|DOMAIN_KNOWLEDGE",
                  "isFollowUp": false,
                  "isComplete": false,
                  "scoreForPreviousAnswer": null,
                  "feedbackForPreviousAnswer": null
                }

                For the VERY FIRST question, scoreForPreviousAnswer and feedbackForPreviousAnswer must be null.
                For all subsequent questions, always include score (1-10) and feedback for the PREVIOUS answer.
                When isComplete is true, include the final score and feedback for the last answer.
                """.formatted(langInstruction, difficultyInstruction, role, experienceLevel, skills, role, role);
    }

    /* ── AI Role Matches ── */
    public List<Map<String, Object>> getRoleMatches(List<String> roles, List<String> skills) {
        String prompt = """
                A student is interested in these role areas: %s
                Their skills include: %s

                Based on their selected roles and skills, suggest 6 specific job roles that would be great matches.
                For each role, give a relevance percentage (how well it matches their interests/skills).
                Only suggest roles related to their selected areas — no random unrelated roles.

                Respond in this exact JSON format:
                {
                  "matches": [
                    { "role": "Frontend Developer", "relevance": 92, "reason": "Directly matches your interest in UI development" },
                    { "role": "React Native Developer", "relevance": 85, "reason": "Extends your frontend skills to mobile" }
                  ]
                }
                """.formatted(
                String.join(", ", roles),
                skills.isEmpty() ? "not specified" : String.join(", ", skills)
        );

        List<GroqService.Message> messages = List.of(
                new GroqService.Message("system", "You are a career counselor. Always respond in valid JSON only."),
                new GroqService.Message("user", prompt)
        );

        try {
            String raw = groq.chat(messages);
            JsonNode json = parseJson(raw);
            List<Map<String, Object>> result = new ArrayList<>();
            json.path("matches").forEach(node -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("role", node.path("role").asText());
                m.put("relevance", node.path("relevance").asInt());
                m.put("reason", node.path("reason").asText());
                result.add(m);
            });
            return result;
        } catch (Exception e) {
            return List.of();
        }
    }

    /* ── Get aspiration options for pre-interview setup ── */
    public InterviewDto.AspirationOption getAspirationOptions(String email) {
        Student student = getStudent(email);

        // pull roles from saved aspirations (My Aspiration page)
        List<String> roles = aspirationRepo.findByStudentOrderByCreatedAtDesc(student)
                .stream()
                .map(StudentAspiration::getRoleArea)
                .filter(r -> r != null && !r.isBlank())
                .distinct()
                .toList();

        StudentProfile profile = profileRepo.findByStudent(student).orElse(null);
        List<String> skills = (profile != null) ? profile.getSkills() : List.of();
        String expLevel = (profile != null && profile.getExperienceCategory() != null)
                ? profile.getExperienceCategory() : "Fresher";

        return InterviewDto.AspirationOption.builder()
                .roles(roles)   // empty list = no aspirations saved
                .skills(skills)
                .experienceLevel(expLevel)
                .build();
    }

    /* ── Pre-interview MCQ round ── */
    public InterviewDto.McqGenerateResponse generateQuiz(String email, String role) {
        getStudent(email); // ensure authenticated student

        String prompt = """
                Generate exactly 10 multiple-choice questions to screen a candidate's knowledge for the role of "%s".
                Questions should cover a mix of foundational and practical concepts for this role.
                Each question must have exactly 4 options, with exactly one correct answer.

                Respond ONLY with this exact JSON format, no markdown, no explanation:
                {
                  "questions": [
                    {
                      "questionText": "Question here",
                      "options": ["Option A", "Option B", "Option C", "Option D"],
                      "correctIndex": 0
                    }
                  ]
                }
                """.formatted(role);

        List<GroqService.Message> messages = List.of(
                new GroqService.Message("system", "You are an expert technical assessor. Always respond in valid JSON."),
                new GroqService.Message("user", prompt)
        );

        String raw = groq.chat(messages, 2048);
        JsonNode json = parseJson(raw);

        List<InterviewDto.McqQuestion> fullQuestions = new ArrayList<>();
        for (JsonNode q : json.path("questions")) {
            List<String> options = new ArrayList<>();
            q.path("options").forEach(o -> options.add(o.asText()));
            fullQuestions.add(InterviewDto.McqQuestion.builder()
                    .questionText(q.path("questionText").asText())
                    .options(options)
                    .correctIndex(q.path("correctIndex").asInt(0))
                    .build());
        }

        String quizId = UUID.randomUUID().toString();
        mcqQuizStore.put(quizId, fullQuestions);

        // strip correctIndex before returning to client
        List<InterviewDto.McqQuestion> clientQuestions = fullQuestions.stream()
                .map(q -> InterviewDto.McqQuestion.builder()
                        .questionText(q.getQuestionText())
                        .options(q.getOptions())
                        .build())
                .toList();

        return InterviewDto.McqGenerateResponse.builder()
                .quizId(quizId)
                .questions(clientQuestions)
                .build();
    }

    public InterviewDto.McqEvaluateResponse evaluateQuiz(String email, String quizId, List<Integer> selectedAnswers) {
        getStudent(email);
        List<InterviewDto.McqQuestion> fullQuestions = mcqQuizStore.remove(quizId);
        if (fullQuestions == null)
            throw new RuntimeException("Quiz not found or already evaluated");

        int score = 0;
        List<InterviewDto.McqReviewItem> review = new ArrayList<>();
        for (int i = 0; i < fullQuestions.size(); i++) {
            InterviewDto.McqQuestion q = fullQuestions.get(i);
            Integer selected = (selectedAnswers != null && i < selectedAnswers.size()) ? selectedAnswers.get(i) : null;
            boolean correct = selected != null && selected.equals(q.getCorrectIndex());
            if (correct) score++;
            review.add(InterviewDto.McqReviewItem.builder()
                    .questionText(q.getQuestionText())
                    .options(q.getOptions())
                    .selectedIndex(selected)
                    .correctIndex(q.getCorrectIndex())
                    .correct(correct)
                    .build());
        }

        int difficultyLevel;
        if (score <= 3) difficultyLevel = 10;
        else if (score <= 6) difficultyLevel = 8;
        else if (score <= 8) difficultyLevel = 5;
        else difficultyLevel = 2;

        return InterviewDto.McqEvaluateResponse.builder()
                .score(score)
                .difficultyLevel(difficultyLevel)
                .review(review)
                .build();
    }

    /* ── Start Session ── */
    @Transactional
    public InterviewDto.SessionResponse startSession(String email, InterviewDto.StartRequest request) {
        Student student = getStudent(email);

        String language = (request != null && request.getLanguage() != null) ? request.getLanguage() : "English";

        // use selected role from request, fallback to profile
        StudentProfile profile = profileRepo.findByStudent(student).orElse(null);
        String role = (request != null && request.getSelectedRole() != null && !request.getSelectedRole().isBlank())
                ? request.getSelectedRole()
                : "Software Engineer";
        String skills = "General";
        String expLevel = "Fresher";
        Integer difficultyLevel = (request != null && request.getDifficultyLevel() != null) ? request.getDifficultyLevel() : 5;

        if (profile != null) {
            if (!profile.getSkills().isEmpty())
                skills = String.join(", ", profile.getSkills());
            if (profile.getExperienceCategory() != null)
                expLevel = profile.getExperienceCategory();
        }

        String mcqReviewJson = null;
        Integer mcqScore = (request != null) ? request.getMcqScore() : null;
        if (request != null && request.getMcqReview() != null) {
            try { mcqReviewJson = mapper.writeValueAsString(request.getMcqReview()); }
            catch (Exception ignored) {}
        }

        InterviewSession session = InterviewSession.builder()
                .student(student)
                .targetRole(role)
                .experienceLevel(expLevel)
                .skills(skills)
                .language(language)
                .difficultyLevel(difficultyLevel)
                .mcqScore(mcqScore)
                .mcqReview(mcqReviewJson)
                .status(SessionStatus.IN_PROGRESS)
                .build();
        session = sessionRepo.save(session);

        // ask Groq for first question
        String systemPrompt = buildSystemPrompt(role, expLevel, skills, language, difficultyLevel);
        List<GroqService.Message> messages = List.of(
                new GroqService.Message("system", systemPrompt),
                new GroqService.Message("user", "Please start the interview with the first question.")
        );

        String raw = groq.chat(messages);
        JsonNode json = parseJson(raw);

        InterviewQuestion q = InterviewQuestion.builder()
                .session(session)
                .sequenceNumber(1)
                .topicArea(json.path("topicArea").asText("WARMUP"))
                .questionText(json.path("questionText").asText())
                .isFollowUp(false)
                .build();
        questionRepo.save(q);

        return InterviewDto.SessionResponse.builder()
                .sessionId(session.getId())
                .questionId(q.getId())
                .questionText(q.getQuestionText())
                .topicArea(q.getTopicArea())
                .questionNumber(1)
                .isComplete(false)
                .targetRole(role)
                .build();
    }

    /* ── Submit Answer ── */
    @Transactional
    public InterviewDto.SessionResponse submitAnswer(String email, Long sessionId, Long questionId, String transcript, Integer violationCount) {
        Student student = getStudent(email);
        InterviewSession session = sessionRepo.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != SessionStatus.IN_PROGRESS)
            throw new RuntimeException("Session is not active");

        // persist latest violation count
        if (violationCount != null && violationCount > 0)
            session.setViolationCount(violationCount);

        // save transcript to current question
        InterviewQuestion current = questionRepo.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        current.setStudentAnswerTranscript(transcript);
        current.setAnsweredAt(LocalDateTime.now());
        questionRepo.save(current);

        // build full conversation history for Groq
        List<InterviewQuestion> allQuestions = questionRepo.findBySessionOrderBySequenceNumber(session);
        String systemPrompt = buildSystemPrompt(session.getTargetRole(), session.getExperienceLevel(), session.getSkills(), session.getLanguage(), session.getDifficultyLevel());

        List<GroqService.Message> messages = new ArrayList<>();
        messages.add(new GroqService.Message("system", systemPrompt));
        messages.add(new GroqService.Message("user", "Please start the interview with the first question."));

        for (InterviewQuestion q : allQuestions) {
            messages.add(new GroqService.Message("assistant",
                    buildAiMessage(q.getQuestionText(), q.getTopicArea(), false, false, null, null)));
            if (q.getStudentAnswerTranscript() != null) {
                String ans = q.getStudentAnswerTranscript().isBlank()
                        ? "[The student did not answer this question. Please score it 1 and provide feedback asking them to attempt all questions.]"
                        : q.getStudentAnswerTranscript();
                messages.add(new GroqService.Message("user", ans));
            }
        }

        String raw = groq.chat(messages);
        JsonNode json = parseJson(raw);

        // save score/feedback to current question from Groq's evaluation
        int score = json.path("scoreForPreviousAnswer").asInt(5);
        String feedback = json.path("feedbackForPreviousAnswer").asText("");
        current.setAiScore(score);
        current.setAiFeedback(feedback);
        questionRepo.save(current);

        boolean isComplete = json.path("isComplete").asBoolean(false);
        int nextSeq = allQuestions.size() + 1;

        if (isComplete || nextSeq > 15) {
            // end the session
            session.setStatus(SessionStatus.COMPLETED);
            session.setEndedAt(LocalDateTime.now());
            session.setDurationMinutes((int) ChronoUnit.MINUTES.between(session.getStartedAt(), session.getEndedAt()));
            sessionRepo.save(session);
            generateReport(session);

            return InterviewDto.SessionResponse.builder()
                    .sessionId(sessionId)
                    .questionId(null)
                    .questionText(null)
                    .isComplete(true)
                    .questionNumber(nextSeq - 1)
                    .scoreForPreviousAnswer(score)
                    .feedbackForPreviousAnswer(feedback)
                    .build();
        }

        // save next question
        InterviewQuestion next = InterviewQuestion.builder()
                .session(session)
                .sequenceNumber(nextSeq)
                .topicArea(json.path("topicArea").asText("TECHNICAL"))
                .questionText(json.path("questionText").asText())
                .isFollowUp(json.path("isFollowUp").asBoolean(false))
                .build();
        questionRepo.save(next);

        return InterviewDto.SessionResponse.builder()
                .sessionId(sessionId)
                .questionId(next.getId())
                .questionText(next.getQuestionText())
                .topicArea(next.getTopicArea())
                .questionNumber(nextSeq)
                .isComplete(false)
                .scoreForPreviousAnswer(score)
                .feedbackForPreviousAnswer(feedback)
                .build();
    }

    /* ── Generate Final Report ── */
    @Transactional
    public void generateReport(InterviewSession session) {
        List<InterviewQuestion> questions = questionRepo.findBySessionOrderBySequenceNumber(session);

        // compute per-topic scores
        Map<String, List<Integer>> topicScores = new LinkedHashMap<>();
        for (InterviewQuestion q : questions) {
            if (q.getAiScore() != null) {
                topicScores.computeIfAbsent(q.getTopicArea(), k -> new ArrayList<>()).add(q.getAiScore());
            }
        }

        int totalScore = 0;
        int scoredCount = 0;
        List<InterviewTopicScore> topicScoreEntities = new ArrayList<>();

        for (Map.Entry<String, List<Integer>> entry : topicScores.entrySet()) {
            int avg = (int) entry.getValue().stream().mapToInt(i -> i).average().orElse(0);
            int pct = avg * 10; // convert 1-10 to 0-100
            topicScoreEntities.add(InterviewTopicScore.builder()
                    .session(session)
                    .topicArea(entry.getKey())
                    .score(pct)
                    .questionCount(entry.getValue().size())
                    .build());
            totalScore += pct;
            scoredCount++;
        }

        int overallScore = scoredCount > 0 ? totalScore / scoredCount : 0;
        String band = overallScore >= 80 ? "STRONG" : overallScore >= 60 ? "READY" : overallScore >= 40 ? "DEVELOPING" : "BEGINNER";

        session.setOverallScore(overallScore);
        session.setReadinessBand(band);
        session.getTopicScores().addAll(topicScoreEntities);

        // generate AI report summary
        StringBuilder qaSummary = new StringBuilder();
        for (InterviewQuestion q : questions) {
            if (q.getAiScore() != null) {
                qaSummary.append("Q: ").append(q.getQuestionText()).append("\n");
                qaSummary.append("A: ").append(q.getStudentAnswerTranscript()).append("\n");
                qaSummary.append("Score: ").append(q.getAiScore()).append("/10\n\n");
            }
        }

        String reportPrompt = """
                Based on this interview for the role of %s, generate a final evaluation report in JSON:

                %s

                Return JSON:
                {
                  "summary": "2-3 sentence overall assessment",
                  "strengths": ["strength 1", "strength 2", "strength 3"],
                  "improvements": ["area 1", "area 2", "area 3"],
                  "actionPlan": "What the candidate should do next to improve"
                }
                """.formatted(session.getTargetRole(), qaSummary);

        try {
            String raw = groq.chat(List.of(
                    new GroqService.Message("system", "You are an expert interview evaluator. Always respond with valid JSON."),
                    new GroqService.Message("user", reportPrompt)
            ));
            JsonNode json = parseJson(raw);
            session.setReportSummary(json.path("summary").asText());
            session.setStrengths(json.path("strengths").toString());
            session.setImprovements(json.path("improvements").toString());
        } catch (Exception e) {
            session.setReportSummary("Interview completed. Score: " + overallScore + "/100.");
        }

        sessionRepo.save(session);
    }

    /* ── Ideal Answer Suggestion ── */
    public InterviewDto.SuggestionResponse getIdealAnswer(InterviewDto.SuggestionRequest req) {
        String prompt = """
                You are a senior interviewer and career coach.

                A candidate was asked the following interview question for the role of %s:
                QUESTION: %s

                The candidate answered:
                ANSWER: %s

                Please provide:
                1. An ideal model answer for this question (2-4 sentences, concise and clear)
                2. 3-4 key points a strong answer should cover

                Respond in this exact JSON format:
                {
                  "idealAnswer": "A complete model answer here...",
                  "keyPoints": "Point 1 | Point 2 | Point 3 | Point 4"
                }
                """.formatted(
                req.getTargetRole() != null ? req.getTargetRole() : "the applied role",
                req.getQuestionText(),
                (req.getStudentAnswer() == null || req.getStudentAnswer().isBlank()) ? "(No answer given)" : req.getStudentAnswer()
        );

        List<GroqService.Message> messages = List.of(
                new GroqService.Message("system", "You are a helpful senior interviewer. Always respond in valid JSON."),
                new GroqService.Message("user", prompt)
        );

        String raw = groq.chat(messages);
        JsonNode json = parseJson(raw);
        return InterviewDto.SuggestionResponse.builder()
                .idealAnswer(json.path("idealAnswer").asText(""))
                .keyPoints(json.path("keyPoints").asText(""))
                .build();
    }

    /* ── Abandon Session ── */
    @Transactional
    public void abandonSession(String email, Long sessionId) {
        Student student = getStudent(email);
        InterviewSession session = sessionRepo.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        boolean hasAnsweredQuestion = questionRepo.findBySessionOrderBySequenceNumber(session).stream()
                .anyMatch(q -> q.getAiScore() != null);

        session.setEndedAt(LocalDateTime.now());
        session.setDurationMinutes((int) ChronoUnit.MINUTES.between(session.getStartedAt(), session.getEndedAt()));

        if (hasAnsweredQuestion) {
            session.setStatus(SessionStatus.COMPLETED);
            session.setEndedEarly(true);
            sessionRepo.save(session);
            generateReport(session);
        } else {
            session.setStatus(SessionStatus.ABANDONED);
            sessionRepo.save(session);
        }
    }

    /* ── Resume In-Progress Session ── */
    public InterviewDto.SessionResponse resumeSession(String email, Long sessionId) {
        Student student = getStudent(email);
        InterviewSession session = sessionRepo.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<InterviewQuestion> questions = questionRepo.findBySessionOrderBySequenceNumber(session);

        // find the last question that hasn't been answered yet
        InterviewQuestion current = questions.stream()
                .filter(q -> q.getStudentAnswerTranscript() == null)
                .findFirst()
                .orElse(questions.isEmpty() ? null : questions.get(questions.size() - 1));

        if (current == null)
            throw new RuntimeException("No active question found in this session");

        return InterviewDto.SessionResponse.builder()
                .sessionId(session.getId())
                .questionId(current.getId())
                .questionText(current.getQuestionText())
                .topicArea(current.getTopicArea())
                .questionNumber(current.getSequenceNumber())
                .isComplete(false)
                .targetRole(session.getTargetRole())
                .language(session.getLanguage())
                .build();
    }

    /* ── Regenerate Report ── */
    @Transactional
    public InterviewDto.ReportResponse regenerateReport(String email, Long sessionId) {
        Student student = getStudent(email);
        InterviewSession session = sessionRepo.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        // clear existing AI-generated fields so generateReport re-runs fresh
        session.setReportSummary(null);
        session.setStrengths(null);
        session.setImprovements(null);
        session.setOverallScore(null);
        session.setReadinessBand(null);
        session.getTopicScores().clear();
        sessionRepo.save(session);
        generateReport(session);
        return getReport(email, sessionId);
    }

    /* ── Get Sessions List ── */
    public List<InterviewDto.SessionSummary> getSessions(String email) {
        Student student = getStudent(email);
        return sessionRepo.findByStudentOrderByCreatedAtDesc(student)
                .stream().map(s -> InterviewDto.SessionSummary.builder()
                        .id(s.getId())
                        .targetRole(s.getTargetRole())
                        .status(s.getStatus().name())
                        .overallScore(s.getOverallScore())
                        .readinessBand(s.getReadinessBand())
                        .durationMinutes(s.getDurationMinutes())
                        .questionCount(s.getQuestions().size())
                        .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)
                        .build())
                .toList();
    }

    /* ── Get Full Report ── */
    public InterviewDto.ReportResponse getReport(String email, Long sessionId) {
        Student student = getStudent(email);
        InterviewSession session = sessionRepo.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<InterviewQuestion> questions = questionRepo.findBySessionOrderBySequenceNumber(session);

        List<InterviewDto.QuestionDetail> qDetails = questions.stream()
                .map(q -> InterviewDto.QuestionDetail.builder()
                        .id(q.getId())
                        .sequenceNumber(q.getSequenceNumber())
                        .topicArea(q.getTopicArea())
                        .questionText(q.getQuestionText())
                        .studentAnswer(q.getStudentAnswerTranscript())
                        .aiScore(q.getAiScore())
                        .aiFeedback(q.getAiFeedback())
                        .isFollowUp(q.getIsFollowUp())
                        .build())
                .toList();

        List<InterviewDto.TopicScore> topicScoreList = session.getTopicScores().stream()
                .map(t -> InterviewDto.TopicScore.builder()
                        .topicArea(t.getTopicArea())
                        .score(t.getScore())
                        .questionCount(t.getQuestionCount())
                        .build())
                .toList();

        // parse strengths and improvements JSON arrays
        List<String> strengths = parseStringList(session.getStrengths());
        List<String> improvements = parseStringList(session.getImprovements());

        List<InterviewDto.McqReviewItem> mcqReview = List.of();
        if (session.getMcqReview() != null && !session.getMcqReview().isBlank()) {
            try {
                mcqReview = mapper.readValue(session.getMcqReview(),
                        mapper.getTypeFactory().constructCollectionType(List.class, InterviewDto.McqReviewItem.class));
            } catch (Exception ignored) {}
        }

        return InterviewDto.ReportResponse.builder()
                .sessionId(session.getId())
                .targetRole(session.getTargetRole())
                .experienceLevel(session.getExperienceLevel())
                .status(session.getStatus().name())
                .overallScore(session.getOverallScore())
                .readinessBand(session.getReadinessBand())
                .reportSummary(session.getReportSummary())
                .strengths(strengths)
                .improvements(improvements)
                .durationMinutes(session.getDurationMinutes())
                .topicScores(topicScoreList)
                .questions(qDetails)
                .createdAt(session.getCreatedAt() != null ? session.getCreatedAt().toString() : null)
                .violationCount(session.getViolationCount())
                .endedEarly(session.isEndedEarly())
                .mcqScore(session.getMcqScore())
                .difficultyLevel(session.getDifficultyLevel())
                .mcqReview(mcqReview)
                .build();
    }

    /* ── private helpers ── */
    private String buildAiMessage(String question, String topic, boolean isFollowUp, boolean isComplete,
                                   Integer score, String feedback) {
        try {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("questionText", question);
            m.put("topicArea", topic);
            m.put("isFollowUp", isFollowUp);
            m.put("isComplete", isComplete);
            m.put("scoreForPreviousAnswer", score);
            m.put("feedbackForPreviousAnswer", feedback);
            return mapper.writeValueAsString(m);
        } catch (Exception e) {
            return question;
        }
    }

    private JsonNode parseJson(String raw) {
        try {
            return mapper.readTree(raw);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Groq response: " + raw);
        }
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            JsonNode node = mapper.readTree(json);
            List<String> result = new ArrayList<>();
            if (node.isArray()) node.forEach(n -> result.add(n.asText()));
            return result;
        } catch (Exception e) {
            return List.of();
        }
    }
}
