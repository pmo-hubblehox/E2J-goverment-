package com.hubblehox.e2j.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class ResumeParserService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private final ObjectMapper mapper = new ObjectMapper();
    private final GroqService groqService;

    public ResumeParserService(GroqService groqService) {
        this.groqService = groqService;
    }

    public ObjectNode parseFromFileUrl(String fileUrl) {
        ObjectNode result = mapper.createObjectNode();
        try {
            // Step 1: Extract raw text from PDF using PDFBox
            String relativePath = fileUrl.replaceFirst("^/api/files/", "");
            File pdfFile = new File(uploadDir, relativePath);

            if (!pdfFile.exists()) {
                result.put("error", "Resume file not found on server.");
                return result;
            }

            String rawText;
            try (PDDocument doc = Loader.loadPDF(pdfFile)) {
                PDFTextStripper stripper = new PDFTextStripper();
                rawText = stripper.getText(doc);
            }

            if (rawText == null || rawText.isBlank()) {
                result.put("error", "Could not extract text from resume. The PDF may be image-based.");
                return result;
            }

            // Truncate to avoid token limits (first 3000 chars is usually enough for a 1-page resume)
            String truncated = rawText.length() > 3000 ? rawText.substring(0, 3000) : rawText;
            // Step 2: Use Groq LLM to semantically understand any resume format
            String prompt = """
                You are an expert resume parser. Extract structured information from the raw resume text below.
                The text was extracted from a PDF and may have irregular spacing, symbols, or ordering.
                Use semantic understanding — do NOT rely on label matching.

                Return ONLY this JSON (use null for missing fields, empty array [] for missing lists):
                {
                  "firstName": "string or null",
                  "lastName": "string or null",
                  "middleName": "string or null",
                  "email": "string or null",
                  "mobile": "10-digit number string without country code or null",
                  "dob": "YYYY-MM-DD or null",
                  "gender": "Male or Female or Other or null",
                  "maritalStatus": "Single or Married or Divorced or null",
                  "nationality": "string or null",
                  "linkedin": "full URL string or null",
                  "portfolio": "full URL or GitHub URL or null",
                  "addressLine1": "string or null",
                  "addressCity": "string or null",
                  "addressState": "string or null",
                  "addressPin": "string or null",
                  "skills": ["skill1", "skill2"],
                  "education": [
                    {
                      "degree": "full degree name",
                      "school": "institution name",
                      "major": "branch/specialization or null",
                      "year": "graduation year YYYY or null",
                      "pct": "percentage or CGPA as plain number string or null"
                    }
                  ],
                  "experience": [
                    {
                      "company": "company name",
                      "type": "Full-time or Part-time or Internship or Contract",
                      "location": "city or null",
                      "from": "YYYY-MM or null",
                      "to": "YYYY-MM or Present or null"
                    }
                  ],
                  "totalExpYears": number or null,
                  "totalExpMonths": number or null,
                  "expCategory": "Fresher or Experienced or null"
                }

                Resume text:
                """ + truncated;

            String raw = groqService.chat(java.util.List.of(
                new GroqService.Message("system", "You are a resume parser. Always respond in valid JSON only. Never include markdown fences."),
                new GroqService.Message("user", prompt)
            ));

            // Parse and return the LLM response
            JsonNode parsed = mapper.readTree(raw);
            return (ObjectNode) parsed;

        } catch (Exception e) {
            result.put("error", "Resume parsing failed: " + e.getMessage());
            return result;
        }
    }
}
