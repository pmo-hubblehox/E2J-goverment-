const ALLOWED_CURRICULA = [
  "Computer Science",
  "Civil Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
];

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function mapCurriculumFromText(...values) {
  const text = values.map(normalizeText).filter(Boolean).join(" ");

  if (!text) return "";
  if (/(computer|cse|information technology|it|software|data science|artificial intelligence|ai|machine learning|cyber)/.test(text)) {
    return "Computer Science";
  }
  if (/civil/.test(text)) {
    return "Civil Engineering";
  }
  if (/mechanical|mech|automobile|production/.test(text)) {
    return "Mechanical Engineering";
  }
  if (/(electrical|electronics|eee|ece|power|instrumentation)/.test(text)) {
    return "Electrical Engineering";
  }

  return "";
}

function resolveCurriculumChoice({ instituteStudent, program, profile } = {}) {
  const directMatch = mapCurriculumFromText(
    instituteStudent?.program,
    instituteStudent?.specialization,
    program?.name,
    ...(Array.isArray(program?.majors) ? program.majors : [])
  );

  if (directMatch && ALLOWED_CURRICULA.includes(directMatch)) {
    return directMatch;
  }

  const education = Array.isArray(profile?.education) ? profile.education[0] : null;
  const profileMatch = mapCurriculumFromText(education?.degree, education?.specialization);
  if (profileMatch && ALLOWED_CURRICULA.includes(profileMatch)) {
    return profileMatch;
  }

  return "";
}

module.exports = {
  ALLOWED_CURRICULA,
  resolveCurriculumChoice,
};
