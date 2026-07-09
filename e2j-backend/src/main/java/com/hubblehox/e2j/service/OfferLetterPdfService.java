package com.hubblehox.e2j.service;

import com.hubblehox.e2j.entity.JobApplication;
import com.hubblehox.e2j.entity.OfferLetter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class OfferLetterPdfService {

    private static final float MARGIN = 60;
    private static final float FONT_SIZE = 11;
    private static final float LEADING = 16;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMMM yyyy");

    public byte[] generate(JobApplication app, OfferLetter offer) {
        String companyName = app.getJobPosting() != null && app.getJobPosting().getPartner() != null
                ? app.getJobPosting().getPartner().getRegisteredName() : "The Company";
        String studentName = app.getStudent() != null && app.getStudent().getUser() != null
                ? app.getStudent().getUser().getName() : "Candidate";

        List<String> lines = buildLines(companyName, studentName, offer);

        try (PDDocument doc = new PDDocument()) {
            PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float y = writeHeader(cs, bold, companyName);

            for (String line : lines) {
                if (y < MARGIN + LEADING) {
                    cs.close();
                    page = new PDPage(PDRectangle.A4);
                    doc.addPage(page);
                    cs = new PDPageContentStream(doc, page);
                    y = PDRectangle.A4.getHeight() - MARGIN;
                }
                boolean isHeading = "OFFER LETTER".equals(line);
                cs.setFont(isHeading ? bold : regular, isHeading ? 14 : FONT_SIZE);
                cs.beginText();
                cs.newLineAtOffset(MARGIN, y);
                cs.showText(sanitize(line.isEmpty() ? " " : line));
                cs.endText();
                y -= LEADING;
            }
            cs.close();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate offer letter PDF", e);
        }
    }

    private float writeHeader(PDPageContentStream cs, PDFont bold, String companyName) throws IOException {
        float y = PDRectangle.A4.getHeight() - MARGIN;
        cs.setFont(bold, 18);
        cs.beginText();
        cs.newLineAtOffset(MARGIN, y);
        cs.showText(sanitize(companyName));
        cs.endText();
        return y - 34;
    }

    private List<String> buildLines(String companyName, String studentName, OfferLetter offer) {
        List<String> lines = new ArrayList<>();
        lines.add("OFFER LETTER");
        lines.add("");
        if (offer.getCreatedAt() != null) lines.add("Date: " + offer.getCreatedAt().toLocalDate().format(DATE_FMT));
        lines.add("");
        lines.add("Dear " + studentName + ",");
        lines.add("");
        StringBuilder intro = new StringBuilder("We are pleased to offer you the position of ")
                .append(nullSafe(offer.getDesignation()));
        if (offer.getDepartment() != null && !offer.getDepartment().isBlank())
            intro.append(" in the ").append(offer.getDepartment()).append(" department");
        intro.append(" at ").append(companyName).append(".");
        lines.addAll(wrap(intro.toString(), 95));
        lines.add("");
        lines.add("Please find below the details of your offer:");
        lines.add("");
        lines.add("Designation:          " + nullSafe(offer.getDesignation()));
        if (offer.getDepartment() != null) lines.add("Department:           " + offer.getDepartment());
        if (offer.getCtc() != null) lines.add("Annual CTC:           Rs. " + offer.getCtc());
        if (offer.getFixedCtc() != null) lines.add("Fixed Component:      Rs. " + offer.getFixedCtc());
        if (offer.getVariableCtc() != null) lines.add("Variable Component:   Rs. " + offer.getVariableCtc());
        if (offer.getJoiningDate() != null) lines.add("Joining Date:         " + offer.getJoiningDate().format(DATE_FMT));
        if (offer.getWorkLocation() != null) lines.add("Work Location:        " + offer.getWorkLocation());
        if (offer.getWorkMode() != null) lines.add("Work Mode:            " + offer.getWorkMode());
        if (offer.getOfferExpiry() != null) lines.add("Offer Valid Until:    " + offer.getOfferExpiry().format(DATE_FMT));
        lines.add("");
        if (offer.getBenefits() != null && !offer.getBenefits().isBlank()) {
            lines.add("Benefits:");
            lines.addAll(wrap(offer.getBenefits(), 95));
            lines.add("");
        }
        if (offer.getSpecialNote() != null && !offer.getSpecialNote().isBlank()) {
            lines.add("Additional Notes:");
            lines.addAll(wrap(offer.getSpecialNote(), 95));
            lines.add("");
        }
        lines.add("This offer is subject to the terms and conditions communicated separately by " + companyName + ".");
        lines.add("");
        lines.add("We look forward to welcoming you to the team.");
        lines.add("");
        lines.add("Sincerely,");
        lines.add(companyName);
        return lines;
    }

    private String nullSafe(String s) { return s == null || s.isBlank() ? "-" : s; }

    /** Strips characters not supported by the standard Helvetica WinAnsi encoding (e.g. rupee sign). */
    private String sanitize(String s) { return s.replaceAll("[^\\x00-\\xFF]", ""); }

    private List<String> wrap(String text, int maxCharsPerLine) {
        List<String> out = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String word : text.split("\\s+")) {
            if (current.length() + word.length() + 1 > maxCharsPerLine) {
                out.add(current.toString());
                current = new StringBuilder();
            }
            if (current.length() > 0) current.append(' ');
            current.append(word);
        }
        if (current.length() > 0) out.add(current.toString());
        return out;
    }
}
