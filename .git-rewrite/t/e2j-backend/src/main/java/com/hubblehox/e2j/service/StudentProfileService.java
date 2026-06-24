package com.hubblehox.e2j.service;

import com.hubblehox.e2j.dto.*;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentProfileService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private final StudentRepository              studentRepo;
    private final StudentProfileRepository       profileRepo;
    private final StudentResumeRepository        resumeRepo;
    private final StudentEducationRepository     educationRepo;
    private final StudentCertificationRepository certRepo;
    private final StudentWorkExperienceRepository workRepo;
    private final StudentPreferredLanguageRepository langRepo;

    // ── Helpers ──────────────────────────────────────────────────────────

    private Student requireStudent(User user) {
        return studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
    }

    private StudentProfile getOrCreateProfile(Student student) {
        return profileRepo.findByStudent(student)
                .orElseGet(() -> profileRepo.save(
                        StudentProfile.builder().student(student).build()));
    }

    private Address toAddress(AddressDto dto) {
        if (dto == null) return new Address();
        return Address.builder()
                .addressLine1(dto.getAddressLine1())
                .addressLine2(dto.getAddressLine2())
                .city(dto.getCity())
                .pincode(dto.getPincode())
                .state(dto.getState())
                .country(dto.getCountry())
                .build();
    }

    private AddressDto fromAddress(Address a) {
        if (a == null) return new AddressDto();
        return AddressDto.builder()
                .addressLine1(a.getAddressLine1())
                .addressLine2(a.getAddressLine2())
                .city(a.getCity())
                .pincode(a.getPincode())
                .state(a.getState())
                .country(a.getCountry())
                .build();
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try { return LocalDate.parse(s); } catch (Exception ignored) {}
        try { return LocalDate.parse(s, DateTimeFormatter.ofPattern("dd-MM-yyyy")); } catch (Exception ignored) {}
        try { return LocalDate.parse(s, DateTimeFormatter.ofPattern("dd/MM/yyyy")); } catch (Exception ignored) {}
        return null;
    }

    // ── Full profile GET ─────────────────────────────────────────────────

    public StudentProfileDto getFullProfile(User user) {
        Student student = requireStudent(user);
        StudentProfile p = getOrCreateProfile(student);

        List<ResumeDto> resumes = resumeRepo.findByStudentOrderByUploadedAtDesc(student)
                .stream().map(r -> ResumeDto.builder()
                        .id(r.getId()).fileName(r.getFileName()).fileUrl(r.getFileUrl())
                        .isPrimary(r.isPrimary())
                        .uploadedAt(r.getUploadedAt() != null ? r.getUploadedAt().toString() : null)
                        .build())
                .collect(Collectors.toList());

        List<EducationDto> educations = educationRepo.findByStudentOrderByCreatedAtAsc(student)
                .stream().map(e -> EducationDto.builder()
                        .id(e.getId()).degree(e.getDegree()).schoolUniversity(e.getSchoolUniversity())
                        .majorSpecialization(e.getMajorSpecialization())
                        .yearOfPassing(e.getYearOfPassing()).percentageCgpa(e.getPercentageCgpa())
                        .build())
                .collect(Collectors.toList());

        List<CertificationDto> certs = certRepo.findByStudentOrderByCreatedAtAsc(student)
                .stream().map(c -> CertificationDto.builder()
                        .id(c.getId()).certificationId(c.getCertificationId())
                        .certificationName(c.getCertificationName())
                        .awardingInstitute(c.getAwardingInstitute())
                        .validTill(c.getValidTill() != null ? c.getValidTill().toString() : null)
                        .fileUrl(c.getFileUrl())
                        .build())
                .collect(Collectors.toList());

        List<WorkExperienceDto> works = workRepo.findByStudentOrderByCreatedAtAsc(student)
                .stream().map(w -> WorkExperienceDto.builder()
                        .id(w.getId()).companyName(w.getCompanyName())
                        .employmentType(w.getEmploymentType()).location(w.getLocation())
                        .locationType(w.getLocationType()).fromDate(w.getFromDate()).toDate(w.getToDate())
                        .build())
                .collect(Collectors.toList());

        List<PreferredLanguageDto> langs = langRepo.findByStudent(student)
                .stream().map(l -> PreferredLanguageDto.builder()
                        .id(l.getId()).language(l.getLanguage())
                        .canRead(l.isCanRead()).canWrite(l.isCanWrite())
                        .canSpeak(l.isCanSpeak()).isNative(l.isNative())
                        .build())
                .collect(Collectors.toList());

        return StudentProfileDto.builder()
                .title(p.getTitle()).firstName(p.getFirstName()).middleName(p.getMiddleName())
                .lastName(p.getLastName())
                .dob(p.getDob() != null ? p.getDob().toString() : null)
                .gender(p.getGender()).nationality(p.getNationality())
                .maritalStatus(p.getMaritalStatus()).physChallenged(p.getPhysChallenged())
                .remark(p.getRemark()).mobilePrimary(p.getMobilePrimary())
                .mobileAlternate(p.getMobileAlternate()).email(user.getEmail())
                .alternateEmail(p.getAlternateEmail())
                .photoUrl(p.getPhotoUrl())
                .presentAddress(fromAddress(p.getPresentAddress()))
                .permanentAddress(fromAddress(p.getPermanentAddress()))
                .sameAddress(p.isSameAddress())
                .linkedinUrl(p.getLinkedinUrl()).portfolioUrl(p.getPortfolioUrl())
                .websiteUrl(p.getWebsiteUrl())
                .preferredJobRoles(p.getPreferredJobRoles())
                .preferredLocations(p.getPreferredLocations())
                .preferredLanguages(langs)
                .annualCtc(p.getAnnualCtc()).variableCtc(p.getVariableCtc())
                .fixedCtc(p.getFixedCtc()).expectedCtc(p.getExpectedCtc())
                .noticePeriod(p.getNoticePeriod())
                .experienceCategory(p.getExperienceCategory())
                .totalExpYears(p.getTotalExpYears()).totalExpMonths(p.getTotalExpMonths())
                .skills(p.getSkills())
                .resumes(resumes).educations(educations)
                .certifications(certs).workExperiences(works)
                .profileCompleted(p.isProfileCompleted())
                .build();
    }

    // ── Personal Information ─────────────────────────────────────────────

    @Transactional
    public StudentProfileDto savePersonalInfo(User user, StudentProfileDto dto) {
        Student student = requireStudent(user);
        StudentProfile p = getOrCreateProfile(student);

        p.setTitle(dto.getTitle());
        p.setFirstName(dto.getFirstName());
        p.setMiddleName(dto.getMiddleName());
        p.setLastName(dto.getLastName());
        p.setDob(parseDate(dto.getDob()));
        p.setGender(dto.getGender());
        p.setNationality(dto.getNationality());
        p.setMaritalStatus(dto.getMaritalStatus());
        p.setPhysChallenged(dto.getPhysChallenged());
        p.setRemark(dto.getRemark());
        p.setMobilePrimary(dto.getMobilePrimary());
        p.setMobileAlternate(dto.getMobileAlternate());
        p.setAlternateEmail(dto.getAlternateEmail());
        p.setPhotoUrl(dto.getPhotoUrl());

        profileRepo.save(p);
        return getFullProfile(user);
    }

    // ── Addresses ────────────────────────────────────────────────────────

    @Transactional
    public StudentProfileDto saveAddresses(User user, StudentProfileDto dto) {
        Student student = requireStudent(user);
        StudentProfile p = getOrCreateProfile(student);

        p.setPresentAddress(toAddress(dto.getPresentAddress()));
        p.setSameAddress(dto.isSameAddress());
        p.setPermanentAddress(dto.isSameAddress()
                ? toAddress(dto.getPresentAddress())
                : toAddress(dto.getPermanentAddress()));

        profileRepo.save(p);
        return getFullProfile(user);
    }

    // ── Social Media ─────────────────────────────────────────────────────

    @Transactional
    public StudentProfileDto saveSocialMedia(User user, StudentProfileDto dto) {
        Student student = requireStudent(user);
        StudentProfile p = getOrCreateProfile(student);

        p.setLinkedinUrl(dto.getLinkedinUrl());
        p.setPortfolioUrl(dto.getPortfolioUrl());
        p.setWebsiteUrl(dto.getWebsiteUrl());

        profileRepo.save(p);
        return getFullProfile(user);
    }

    // ── Job Preferences (roles + locations) ──────────────────────────────

    @Transactional
    public StudentProfileDto saveJobPreferences(User user, StudentProfileDto dto) {
        Student student = requireStudent(user);
        StudentProfile p = getOrCreateProfile(student);

        if (dto.getPreferredJobRoles() != null) p.setPreferredJobRoles(dto.getPreferredJobRoles());
        if (dto.getPreferredLocations() != null) p.setPreferredLocations(dto.getPreferredLocations());

        profileRepo.save(p);
        return getFullProfile(user);
    }

    // ── Preferred Languages (replace all) ────────────────────────────────

    @Transactional
    public StudentProfileDto saveLanguages(User user, List<PreferredLanguageDto> dtos) {
        Student student = requireStudent(user);
        langRepo.deleteByStudent(student);

        if (dtos != null) {
            List<StudentPreferredLanguage> entities = dtos.stream()
                    .map(d -> StudentPreferredLanguage.builder()
                            .student(student).language(d.getLanguage())
                            .canRead(d.isCanRead()).canWrite(d.isCanWrite())
                            .canSpeak(d.isCanSpeak()).isNative(d.isNative())
                            .build())
                    .collect(Collectors.toList());
            langRepo.saveAll(entities);
        }
        return getFullProfile(user);
    }

    // ── Salary Expectations ───────────────────────────────────────────────

    @Transactional
    public StudentProfileDto saveSalary(User user, StudentProfileDto dto) {
        Student student = requireStudent(user);
        StudentProfile p = getOrCreateProfile(student);

        p.setAnnualCtc(dto.getAnnualCtc());
        p.setVariableCtc(dto.getVariableCtc());
        p.setFixedCtc(dto.getFixedCtc());
        p.setExpectedCtc(dto.getExpectedCtc());
        p.setNoticePeriod(dto.getNoticePeriod());

        profileRepo.save(p);
        return getFullProfile(user);
    }

    // ── Skills ───────────────────────────────────────────────────────────

    @Transactional
    public StudentProfileDto saveSkills(User user, List<String> skills) {
        Student student = requireStudent(user);
        StudentProfile p = getOrCreateProfile(student);
        p.setSkills(skills);
        profileRepo.save(p);
        return getFullProfile(user);
    }

    // ── Experience Summary ────────────────────────────────────────────────

    @Transactional
    public StudentProfileDto saveExperienceSummary(User user, StudentProfileDto dto) {
        Student student = requireStudent(user);
        StudentProfile p = getOrCreateProfile(student);

        p.setExperienceCategory(dto.getExperienceCategory());
        p.setTotalExpYears(dto.getTotalExpYears());
        p.setTotalExpMonths(dto.getTotalExpMonths());

        profileRepo.save(p);
        return getFullProfile(user);
    }

    // ── Complete Profile ──────────────────────────────────────────────────

    @Transactional
    public StudentProfileDto completeProfile(User user) {
        Student student = requireStudent(user);
        StudentProfile p = getOrCreateProfile(student);
        p.setProfileCompleted(true);
        profileRepo.save(p);
        return getFullProfile(user);
    }

    // ── Resumes ───────────────────────────────────────────────────────────

    @Transactional
    public ResumeDto addResume(User user, ResumeDto dto) {
        Student student = requireStudent(user);

        if (dto.isPrimary()) {
            resumeRepo.clearPrimary(student);
        }
        if (resumeRepo.findByStudentOrderByUploadedAtDesc(student).isEmpty()) {
            dto = ResumeDto.builder()
                    .fileName(dto.getFileName()).fileUrl(dto.getFileUrl()).isPrimary(true)
                    .build();
        }

        StudentResume resume = StudentResume.builder()
                .student(student).fileName(dto.getFileName())
                .fileUrl(dto.getFileUrl()).isPrimary(dto.isPrimary())
                .build();
        resume = resumeRepo.save(resume);

        return ResumeDto.builder()
                .id(resume.getId()).fileName(resume.getFileName()).fileUrl(resume.getFileUrl())
                .isPrimary(resume.isPrimary())
                .uploadedAt(resume.getUploadedAt() != null ? resume.getUploadedAt().toString() : null)
                .build();
    }

    @Transactional
    public void setPrimaryResume(User user, Long resumeId) {
        Student student = requireStudent(user);
        StudentResume resume = resumeRepo.findById(resumeId)
                .orElseThrow(() -> new AppException("Resume not found", HttpStatus.NOT_FOUND));
        if (!resume.getStudent().getId().equals(student.getId()))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);

        resumeRepo.clearPrimary(student);
        resume.setPrimary(true);
        resumeRepo.save(resume);
    }

    @Transactional
    public void deleteResume(User user, Long resumeId) {
        Student student = requireStudent(user);
        StudentResume resume = resumeRepo.findById(resumeId)
                .orElseThrow(() -> new AppException("Resume not found", HttpStatus.NOT_FOUND));
        if (!resume.getStudent().getId().equals(student.getId()))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);

        // Delete file from disk: /api/files/{relative} → uploads/{relative}
        String fileUrl = resume.getFileUrl();
        if (fileUrl != null && !fileUrl.isBlank()) {
            String relative = fileUrl.replaceFirst("^/api/files/", "");
            Path filePath = Paths.get(uploadDir, relative);
            try {
                Files.deleteIfExists(filePath);
                log.info("Deleted resume file: {}", filePath.toAbsolutePath());
            } catch (IOException e) {
                log.warn("Could not delete resume file {}: {}", filePath, e.getMessage());
            }
        }

        resumeRepo.delete(resume);
    }

    // ── Education ─────────────────────────────────────────────────────────

    @Transactional
    public EducationDto addEducation(User user, EducationDto dto) {
        Student student = requireStudent(user);
        StudentEducation edu = StudentEducation.builder()
                .student(student).degree(dto.getDegree())
                .schoolUniversity(dto.getSchoolUniversity())
                .majorSpecialization(dto.getMajorSpecialization())
                .yearOfPassing(dto.getYearOfPassing())
                .percentageCgpa(dto.getPercentageCgpa())
                .build();
        edu = educationRepo.save(edu);
        return toEducationDto(edu);
    }

    @Transactional
    public EducationDto updateEducation(User user, Long id, EducationDto dto) {
        Student student = requireStudent(user);
        StudentEducation edu = educationRepo.findById(id)
                .orElseThrow(() -> new AppException("Education not found", HttpStatus.NOT_FOUND));
        if (!edu.getStudent().getId().equals(student.getId()))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        if (edu.isLocked())
            throw new AppException("This education entry was set by your institution and cannot be edited.", HttpStatus.FORBIDDEN);

        edu.setDegree(dto.getDegree());
        edu.setSchoolUniversity(dto.getSchoolUniversity());
        edu.setMajorSpecialization(dto.getMajorSpecialization());
        edu.setYearOfPassing(dto.getYearOfPassing());
        edu.setPercentageCgpa(dto.getPercentageCgpa());
        return toEducationDto(educationRepo.save(edu));
    }

    @Transactional
    public void deleteEducation(User user, Long id) {
        Student student = requireStudent(user);
        StudentEducation edu = educationRepo.findById(id)
                .orElseThrow(() -> new AppException("Education not found", HttpStatus.NOT_FOUND));
        if (!edu.getStudent().getId().equals(student.getId()))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        if (edu.isLocked())
            throw new AppException("This education entry was set by your institution and cannot be deleted.", HttpStatus.FORBIDDEN);
        educationRepo.delete(edu);
    }

    private EducationDto toEducationDto(StudentEducation e) {
        return EducationDto.builder()
                .id(e.getId()).degree(e.getDegree()).schoolUniversity(e.getSchoolUniversity())
                .majorSpecialization(e.getMajorSpecialization())
                .yearOfPassing(e.getYearOfPassing()).percentageCgpa(e.getPercentageCgpa())
                .locked(e.isLocked())
                .build();
    }

    // ── Certifications ────────────────────────────────────────────────────

    @Transactional
    public CertificationDto addCertification(User user, CertificationDto dto) {
        Student student = requireStudent(user);
        StudentCertification cert = StudentCertification.builder()
                .student(student).certificationId(dto.getCertificationId())
                .certificationName(dto.getCertificationName())
                .awardingInstitute(dto.getAwardingInstitute())
                .validTill(parseDate(dto.getValidTill()))
                .fileUrl(dto.getFileUrl())
                .build();
        cert = certRepo.save(cert);
        return toCertDto(cert);
    }

    @Transactional
    public CertificationDto updateCertification(User user, Long id, CertificationDto dto) {
        Student student = requireStudent(user);
        StudentCertification cert = certRepo.findById(id)
                .orElseThrow(() -> new AppException("Certification not found", HttpStatus.NOT_FOUND));
        if (!cert.getStudent().getId().equals(student.getId()))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);

        cert.setCertificationId(dto.getCertificationId());
        cert.setCertificationName(dto.getCertificationName());
        cert.setAwardingInstitute(dto.getAwardingInstitute());
        cert.setValidTill(parseDate(dto.getValidTill()));
        cert.setFileUrl(dto.getFileUrl());
        return toCertDto(certRepo.save(cert));
    }

    @Transactional
    public void deleteCertification(User user, Long id) {
        Student student = requireStudent(user);
        StudentCertification cert = certRepo.findById(id)
                .orElseThrow(() -> new AppException("Certification not found", HttpStatus.NOT_FOUND));
        if (!cert.getStudent().getId().equals(student.getId()))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        certRepo.delete(cert);
    }

    private CertificationDto toCertDto(StudentCertification c) {
        return CertificationDto.builder()
                .id(c.getId()).certificationId(c.getCertificationId())
                .certificationName(c.getCertificationName())
                .awardingInstitute(c.getAwardingInstitute())
                .validTill(c.getValidTill() != null ? c.getValidTill().toString() : null)
                .fileUrl(c.getFileUrl())
                .build();
    }

    // ── Work Experience ───────────────────────────────────────────────────

    @Transactional
    public WorkExperienceDto addWorkExperience(User user, WorkExperienceDto dto) {
        Student student = requireStudent(user);
        StudentWorkExperience work = StudentWorkExperience.builder()
                .student(student).companyName(dto.getCompanyName())
                .employmentType(dto.getEmploymentType()).location(dto.getLocation())
                .locationType(dto.getLocationType()).fromDate(dto.getFromDate())
                .toDate(dto.getToDate())
                .build();
        work = workRepo.save(work);
        return toWorkDto(work);
    }

    @Transactional
    public WorkExperienceDto updateWorkExperience(User user, Long id, WorkExperienceDto dto) {
        Student student = requireStudent(user);
        StudentWorkExperience work = workRepo.findById(id)
                .orElseThrow(() -> new AppException("Work experience not found", HttpStatus.NOT_FOUND));
        if (!work.getStudent().getId().equals(student.getId()))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);

        work.setCompanyName(dto.getCompanyName());
        work.setEmploymentType(dto.getEmploymentType());
        work.setLocation(dto.getLocation());
        work.setLocationType(dto.getLocationType());
        work.setFromDate(dto.getFromDate());
        work.setToDate(dto.getToDate());
        return toWorkDto(workRepo.save(work));
    }

    @Transactional
    public void deleteWorkExperience(User user, Long id) {
        Student student = requireStudent(user);
        StudentWorkExperience work = workRepo.findById(id)
                .orElseThrow(() -> new AppException("Work experience not found", HttpStatus.NOT_FOUND));
        if (!work.getStudent().getId().equals(student.getId()))
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        workRepo.delete(work);
    }

    private WorkExperienceDto toWorkDto(StudentWorkExperience w) {
        return WorkExperienceDto.builder()
                .id(w.getId()).companyName(w.getCompanyName())
                .employmentType(w.getEmploymentType()).location(w.getLocation())
                .locationType(w.getLocationType()).fromDate(w.getFromDate()).toDate(w.getToDate())
                .build();
    }
}
