const OpenAI = require("openai");

const OPENAI_MODEL = process.env.OPENAI_RESUME_MODEL || "gpt-4.1-mini";

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDateToIso(value) {
  const raw = sanitizeString(value);
  if (!raw) return "";
  const maybeDate = new Date(raw);
  if (Number.isNaN(maybeDate.getTime())) return "";
  const yyyy = maybeDate.getFullYear();
  const mm = String(maybeDate.getMonth() + 1).padStart(2, "0");
  const dd = String(maybeDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeMonth(value) {
  const raw = sanitizeString(value);
  if (!raw) return "";
  const maybeDate = new Date(raw);
  if (Number.isNaN(maybeDate.getTime())) return "";
  const yyyy = maybeDate.getFullYear();
  const mm = String(maybeDate.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function normalizeAddress(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    line1: sanitizeString(source.line1),
    line2: sanitizeString(source.line2),
    city: sanitizeString(source.city),
    state: sanitizeString(source.state),
    country: sanitizeString(source.country),
    pincode: sanitizeString(source.pincode),
  };
}

function normalizeLanguages(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => ({
      language: sanitizeString(item?.language),
      canRead: Boolean(item?.canRead),
      canWrite: Boolean(item?.canWrite),
      canSpeak: Boolean(item?.canSpeak),
      isNative: Boolean(item?.isNative),
    }))
    .filter((item) => item.language);
}

function normalizeEducation(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => ({
      degree: sanitizeString(item?.degree),
      college: sanitizeString(item?.college),
      specialization: sanitizeString(item?.specialization),
      yearOfPassing: sanitizeString(item?.yearOfPassing),
      currentlyPursuing: Boolean(item?.currentlyPursuing),
      percentage: sanitizeString(item?.percentage),
    }))
    .filter((item) => item.degree || item.college);
}

function normalizeWork(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => ({
      company: sanitizeString(item?.company),
      role: sanitizeString(item?.role),
      location: sanitizeString(item?.location),
      employmentType: sanitizeString(item?.employmentType),
      startDate: normalizeMonth(item?.startDate),
      endDate: normalizeMonth(item?.endDate),
      currentlyWorking: Boolean(item?.currentlyWorking),
    }))
    .filter((item) => item.company || item.role);
}

function normalizeCertifications(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => ({
      certId: sanitizeString(item?.certId),
      name: sanitizeString(item?.name),
      issuer: sanitizeString(item?.issuer),
      validTill: normalizeMonth(item?.validTill),
      file: {
        name: sanitizeString(item?.file?.name),
        url: "",
      },
    }))
    .filter((item) => item.name || item.certId);
}

function normalizeSkills(items) {
  const list = Array.isArray(items) ? items : [];
  const dedup = new Set();
  list.forEach((item) => {
    const skill = sanitizeString(item);
    if (skill) dedup.add(skill);
  });
  return [...dedup];
}

function normalizeJobPreferences(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    currentCTC: sanitizeString(source.currentCTC),
    expectedCTC: sanitizeString(source.expectedCTC),
    noticePeriod: sanitizeString(source.noticePeriod),
  };
}

function normalizeExtractedProfile(input) {
  const source = input && typeof input === "object" ? input : {};

  return {
    title: sanitizeString(source.title),
    firstName: sanitizeString(source.firstName),
    middleName: sanitizeString(source.middleName),
    lastName: sanitizeString(source.lastName),
    dob: normalizeDateToIso(source.dob),
    gender: sanitizeString(source.gender),
    nationality: sanitizeString(source.nationality),
    maritalStatus: sanitizeString(source.maritalStatus),
    physicallyChallenged: sanitizeString(source.physicallyChallenged),
    bloodGroup: sanitizeString(source.bloodGroup),
    mobilePrimary: sanitizeString(source.mobilePrimary),
    mobileAlternate: sanitizeString(source.mobileAlternate),
    email: sanitizeString(source.email),
    presentAddress: normalizeAddress(source.presentAddress),
    permanentAddress: normalizeAddress(source.permanentAddress),
    education: normalizeEducation(source.education),
    work: normalizeWork(source.work),
    certifications: normalizeCertifications(source.certifications),
    skills: normalizeSkills(source.skills),
    languages: normalizeLanguages(source.languages),
    experienceCategory: sanitizeString(source.experienceCategory),
    totalExperience: sanitizeString(source.totalExperience),
    jobPreferences: normalizeJobPreferences(source.jobPreferences),
  };
}

function mergeExtraction(aiProfile, fallbackProfile) {
  const ai = normalizeExtractedProfile(aiProfile);
  const fallback = normalizeExtractedProfile(fallbackProfile);

  const pick = (a, b) => (a ? a : b);
  const pickAddress = (a, b) => ({
    line1: pick(a.line1, b.line1),
    line2: pick(a.line2, b.line2),
    city: pick(a.city, b.city),
    state: pick(a.state, b.state),
    country: pick(a.country, b.country),
    pincode: pick(a.pincode, b.pincode),
  });

  return {
    title: pick(ai.title, fallback.title),
    firstName: pick(ai.firstName, fallback.firstName),
    middleName: pick(ai.middleName, fallback.middleName),
    lastName: pick(ai.lastName, fallback.lastName),
    dob: pick(ai.dob, fallback.dob),
    gender: pick(ai.gender, fallback.gender),
    nationality: pick(ai.nationality, fallback.nationality),
    maritalStatus: pick(ai.maritalStatus, fallback.maritalStatus),
    physicallyChallenged: pick(ai.physicallyChallenged, fallback.physicallyChallenged),
    bloodGroup: pick(ai.bloodGroup, fallback.bloodGroup),
    mobilePrimary: pick(ai.mobilePrimary, fallback.mobilePrimary),
    mobileAlternate: pick(ai.mobileAlternate, fallback.mobileAlternate),
    email: pick(ai.email, fallback.email),
    presentAddress: pickAddress(ai.presentAddress, fallback.presentAddress),
    permanentAddress: pickAddress(ai.permanentAddress, fallback.permanentAddress),
    education: ai.education.length ? ai.education : fallback.education,
    work: ai.work.length ? ai.work : fallback.work,
    certifications: ai.certifications.length ? ai.certifications : fallback.certifications,
    skills: ai.skills.length ? ai.skills : fallback.skills,
    languages: ai.languages.length ? ai.languages : fallback.languages,
    experienceCategory: pick(ai.experienceCategory, fallback.experienceCategory),
    totalExperience: pick(ai.totalExperience, fallback.totalExperience),
    jobPreferences: {
      currentCTC: pick(ai.jobPreferences.currentCTC, fallback.jobPreferences.currentCTC),
      expectedCTC: pick(ai.jobPreferences.expectedCTC, fallback.jobPreferences.expectedCTC),
      noticePeriod: pick(ai.jobPreferences.noticePeriod, fallback.jobPreferences.noticePeriod),
    },
  };
}

function fallbackFromText(text) {
  const safeText = sanitizeString(text);
  const email = safeText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] || "";
  const phoneRaw =
    safeText.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)\d{3,5}[\s-]?\d{3,5}/)?.[0] || "";
  const phoneDigits = phoneRaw.replace(/\D/g, "");
  const mobilePrimary = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : "";

  const skillLines = safeText
    .split(/\r?\n/)
    .filter((line) => /\b(skills?|technologies|tools)\b/i.test(line))
    .map((line) => line.split(":").slice(1).join(":").trim())
    .filter(Boolean);

  const skills = normalizeSkills(
    skillLines
      .join(",")
      .split(/[,|/]/)
      .map((s) => s.trim())
      .filter(Boolean)
  );

  return normalizeExtractedProfile({
    email,
    mobilePrimary,
    skills,
  });
}

function buildPrompt(resumeText) {
  return `You are an expert resume parser.
Extract details from this resume text and return ONLY strict JSON with this exact top-level shape:
{
  "title": "",
  "firstName": "",
  "middleName": "",
  "lastName": "",
  "dob": "",
  "gender": "",
  "nationality": "",
  "maritalStatus": "",
  "physicallyChallenged": "",
  "bloodGroup": "",
  "mobilePrimary": "",
  "mobileAlternate": "",
  "email": "",
  "presentAddress": {"line1":"","line2":"","city":"","state":"","country":"","pincode":""},
  "permanentAddress": {"line1":"","line2":"","city":"","state":"","country":"","pincode":""},
  "education": [{"degree":"","college":"","specialization":"","yearOfPassing":"","currentlyPursuing":false,"percentage":""}],
  "work": [{"company":"","role":"","location":"","employmentType":"","startDate":"","endDate":"","currentlyWorking":false}],
  "certifications": [{"certId":"","name":"","issuer":"","validTill":"","file":{"name":"","url":""}}],
  "skills": [""],
  "languages": [{"language":"","canRead":false,"canWrite":false,"canSpeak":false,"isNative":false}],
  "experienceCategory": "",
  "totalExperience": "",
  "jobPreferences": {"currentCTC":"","expectedCTC":"","noticePeriod":""}
}
Rules:
1) Use empty strings/false/[] when unavailable.
2) Do not hallucinate company/school names.
3) Work dates: use month form like YYYY-MM when possible.
4) DOB: use date string from resume if present.
5) Extract multiple education/work rows whenever present.

Resume text:
${resumeText}`;
}

async function extractWithOpenAI(resumeText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { extractedProfile: null, provider: "none", error: "OPENAI_API_KEY is missing" };
  }

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You extract resume data into strict JSON." },
      { role: "user", content: buildPrompt(resumeText.slice(0, 120000)) },
    ],
  });

  const content = completion.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return {
    extractedProfile: normalizeExtractedProfile(parsed),
    provider: "openai",
    model: completion.model || OPENAI_MODEL,
  };
}

async function extractResumeProfile({ resumeText, fallbackData }) {
  const fallbackProfile = mergeExtraction(fallbackData, fallbackFromText(resumeText));

  try {
    const aiResult = await extractWithOpenAI(resumeText);
    if (!aiResult.extractedProfile) {
      return {
        extractedProfile: fallbackProfile,
        provider: aiResult.provider,
        model: aiResult.model || null,
        warning: aiResult.error,
      };
    }

    return {
      extractedProfile: mergeExtraction(aiResult.extractedProfile, fallbackProfile),
      provider: aiResult.provider,
      model: aiResult.model,
      warning: null,
    };
  } catch (error) {
    return {
      extractedProfile: fallbackProfile,
      provider: "fallback",
      model: null,
      warning: "AI extraction failed. Returned fallback extraction.",
    };
  }
}

module.exports = {
  extractResumeProfile,
};
