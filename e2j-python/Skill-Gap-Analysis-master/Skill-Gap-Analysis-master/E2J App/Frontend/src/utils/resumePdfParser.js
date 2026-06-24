import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import Tesseract from "tesseract.js";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const NAME_REGEX = /(?:name)\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{1,60})/i;
const DOB_REGEX = /(?:dob|date\s*of\s*birth)\s*[:\-]?\s*([0-3]?\d[\/.-][01]?\d[\/.-](?:19|20)\d{2}|[A-Za-z]{3,9}\s+[0-3]?\d,?\s+(?:19|20)\d{2})/i;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)\d{3,5}[\s-]?\d{3,5}/;
const ADDRESS_REGEX = /(?:address)\s*[:\-]\s*([^\n\r]{8,120})/i;
const EXP_REGEX = /(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i;
const PINCODE_REGEX = /\b\d{5,6}\b/;

const NAME_STOPWORDS = new Set([
  "resume",
  "curriculum vitae",
  "cv",
  "profile",
  "summary",
  "objective",
  "experience",
  "education",
  "skills",
  "contact",
  "phone",
  "email",
]);

function normalizeWhitespace(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function parseDateToIso(value) {
  if (!value) return "";
  const asDate = new Date(value);
  if (!Number.isNaN(asDate.getTime())) {
    const yyyy = asDate.getFullYear();
    const mm = String(asDate.getMonth() + 1).padStart(2, "0");
    const dd = String(asDate.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const cleaned = value.replace(/[.]/g, "/").replace(/-/g, "/").replace(/,/g, "");
  const parts = cleaned.split("/").map((p) => p.trim());
  if (parts.length !== 3) return "";

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (!day || !month || !year) return "";
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function deriveName(text) {
  const byLabel = text.match(NAME_REGEX)?.[1];
  if (byLabel) return byLabel.trim();

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  for (const line of lines) {
    const compact = line.toLowerCase().trim();
    const hasStopword = [...NAME_STOPWORDS].some((s) => compact.includes(s));
    if (
      !hasStopword &&
      !EMAIL_REGEX.test(line) &&
      !PHONE_REGEX.test(line) &&
      !/\d/.test(line) &&
      /^[A-Za-z][A-Za-z .'-]{2,60}$/.test(line) &&
      line.split(" ").length >= 2
    ) {
      return line;
    }
  }

  return "";
}

function getExperienceCategory(yearsNumber) {
  if (!yearsNumber || Number.isNaN(yearsNumber)) return "";
  if (yearsNumber < 0.5) return "Fresher";
  if (yearsNumber < 2) return "Entry Level (0–2 years)";
  if (yearsNumber < 5) return "Mid Level (2–5 years)";
  if (yearsNumber < 10) return "Senior Level (5–10 years)";
  return "Lead / Principal (10+ years)";
}

function extractFields(text) {
  const extracted = {};
  const summary = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const fullName = deriveName(text);
  if (fullName) {
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    if (nameParts.length >= 2) {
      extracted.firstName = nameParts[0];
      extracted.lastName = nameParts.slice(1).join(" ");
      summary.push("Name");
    }
  }

  const dobRaw = text.match(DOB_REGEX)?.[1] || "";
  const dobIso = parseDateToIso(dobRaw);
  if (dobIso) {
    extracted.dob = dobIso;
    summary.push("DOB");
  }

  const email = text.match(EMAIL_REGEX)?.[0] || "";
  if (email) {
    extracted.email = email;
    summary.push("Email");
  }

  const phoneRaw = text.match(PHONE_REGEX)?.[0] || "";
  const phoneDigits = phoneRaw.replace(/\D/g, "");
  if (phoneDigits.length >= 10) {
    extracted.mobilePrimary = phoneDigits.slice(-10);
    summary.push("Phone");
  }

  let address = normalizeWhitespace(text.match(ADDRESS_REGEX)?.[1] || "");
  if (!address) {
    const likelyAddressLine = lines.find(
      (line) => PINCODE_REGEX.test(line) && /,|\b(street|road|lane|avenue|nagar|city)\b/i.test(line)
    );
    address = normalizeWhitespace(likelyAddressLine || "");
  }
  if (address) {
    extracted.address = address;
    summary.push("Address");
  }

  const expYearsRaw = text.match(EXP_REGEX)?.[1] || "";
  const expYears = parseFloat(expYearsRaw);
  if (!Number.isNaN(expYears) && expYearsRaw) {
    extracted.totalExperience = `${expYearsRaw} years`;
    extracted.experienceCategory = getExperienceCategory(expYears);
    summary.push("Work Experience");
  }

  return { extracted, summary };
}

function buildLinesFromTextItems(items) {
  const buckets = new Map();

  for (const item of items) {
    if (typeof item.str !== "string") continue;
    const y = Math.round((item.transform?.[5] || 0) / 2) * 2;
    const x = item.transform?.[4] || 0;
    const existing = buckets.get(y) || [];
    existing.push({ x, str: item.str });
    buckets.set(y, existing);
  }

  const orderedY = [...buckets.keys()].sort((a, b) => b - a);
  const lines = orderedY.map((y) => {
    const lineItems = buckets.get(y).sort((a, b) => a.x - b.x);
    return normalizeWhitespace(lineItems.map((it) => it.str).join(" "));
  });

  return lines.filter(Boolean).join("\n");
}

async function openPdf(file) {
  const bytes = await file.arrayBuffer();
  const loadingTask = getDocument({ data: bytes });
  return loadingTask.promise;
}

async function extractTextFromPdfLayer(pdf) {
  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = buildLinesFromTextItems(content.items);
    fullText += `${pageText}\n`;
  }

  return fullText;
}

function shouldRunOcr(text, parsedSummarySize) {
  const cleaned = normalizeWhitespace(text);
  if (cleaned.length < 400) return true;
  if (parsedSummarySize < 2) return true;
  const letters = (cleaned.match(/[A-Za-z]/g) || []).length;
  const total = cleaned.length || 1;
  const letterRatio = letters / total;
  return letterRatio < 0.4;
}

async function runOcrOnPdf(pdf) {
  let ocrText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: context, viewport }).promise;

    const ocrResult = await Tesseract.recognize(canvas, "eng", {
      tessedit_pageseg_mode: "1",
    });
    ocrText += `${ocrResult?.data?.text || ""}\n`;

    canvas.width = 1;
    canvas.height = 1;
  }

  return ocrText;
}

export async function extractResumeDataFromPdf(file) {
  const pdf = await openPdf(file);

  const pdfLayerText = await extractTextFromPdfLayer(pdf);
  let parsed = extractFields(pdfLayerText);
  let extractionMode = "pdf-text";
  let finalText = pdfLayerText;

  if (shouldRunOcr(pdfLayerText, parsed.summary.length)) {
    const ocrText = await runOcrOnPdf(pdf);
    const mergedText = `${pdfLayerText}\n${ocrText}`;
    parsed = extractFields(mergedText);
    extractionMode = "hybrid-ocr";
    finalText = mergedText;
  }

  return {
    ...parsed,
    extractionMode,
    text: finalText,
  };
}
