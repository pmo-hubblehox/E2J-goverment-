package com.hubblehox.e2j.service;

import com.hubblehox.e2j.dto.JobPostingDto;
import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.JobPosting;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.IndustryPartnerRepository;
import com.hubblehox.e2j.repository.JobPostingRepository;
import com.hubblehox.e2j.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobPostingService {

    private final JobPostingRepository jobRepo;
    private final IndustryPartnerRepository partnerRepo;
    private final UserRepository userRepo;

    private IndustryPartner getPartner(String email) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        return partnerRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Industry partner profile not found", HttpStatus.NOT_FOUND));
    }

    public JobPostingDto.Response create(String email, JobPostingDto.Request req) {
        IndustryPartner partner = getPartner(email);
        JobPosting posting = buildPosting(req, partner);
        return JobPostingDto.Response.from(jobRepo.save(posting));
    }

    public List<JobPostingDto.Response> list(String email, String type) {
        IndustryPartner partner = getPartner(email);
        List<JobPosting> postings;
        if (type != null && !type.isBlank()) {
            JobPosting.PostingType pt = JobPosting.PostingType.valueOf(type.toUpperCase());
            postings = jobRepo.findByPartnerAndPostingTypeOrderByCreatedAtDesc(partner, pt);
        } else {
            postings = jobRepo.findByPartnerOrderByCreatedAtDesc(partner);
        }
        return postings.stream().map(JobPostingDto.Response::from).toList();
    }

    public JobPostingDto.Response get(String email, Long id) {
        IndustryPartner partner = getPartner(email);
        JobPosting p = jobRepo.findByIdAndPartner(id, partner)
                .orElseThrow(() -> new AppException("Posting not found", HttpStatus.NOT_FOUND));
        return JobPostingDto.Response.from(p);
    }

    public JobPostingDto.Response update(String email, Long id, JobPostingDto.Request req) {
        IndustryPartner partner = getPartner(email);
        JobPosting p = jobRepo.findByIdAndPartner(id, partner)
                .orElseThrow(() -> new AppException("Posting not found", HttpStatus.NOT_FOUND));
        applyUpdate(p, req);
        return JobPostingDto.Response.from(jobRepo.save(p));
    }

    public void delete(String email, Long id) {
        IndustryPartner partner = getPartner(email);
        JobPosting p = jobRepo.findByIdAndPartner(id, partner)
                .orElseThrow(() -> new AppException("Posting not found", HttpStatus.NOT_FOUND));
        jobRepo.delete(p);
    }

    public JobPostingDto.Response updateStatus(String email, Long id, String status) {
        IndustryPartner partner = getPartner(email);
        JobPosting p = jobRepo.findByIdAndPartner(id, partner)
                .orElseThrow(() -> new AppException("Posting not found", HttpStatus.NOT_FOUND));
        p.setStatus(JobPosting.Status.valueOf(status.toUpperCase()));
        return JobPostingDto.Response.from(jobRepo.save(p));
    }

    private JobPosting buildPosting(JobPostingDto.Request req, IndustryPartner partner) {
        JobPosting p = new JobPosting();
        p.setPartner(partner);
        applyUpdate(p, req);
        return p;
    }

    private void applyUpdate(JobPosting p, JobPostingDto.Request req) {
        if (req.getPostingType() != null) p.setPostingType(JobPosting.PostingType.valueOf(req.getPostingType().toUpperCase()));
        if (req.getJobRole() != null) p.setJobRole(req.getJobRole());
        if (req.getDepartment() != null) p.setDepartment(req.getDepartment());
        if (req.getEmploymentType() != null) p.setEmploymentType(req.getEmploymentType());
        if (req.getWorkMode() != null) p.setWorkMode(req.getWorkMode());
        if (req.getLocation() != null) p.setLocation(req.getLocation());
        if (req.getPositions() != null) p.setPositions(req.getPositions());
        if (req.getTargetDate() != null) p.setTargetDate(req.getTargetDate());
        if (req.getAttachJd() != null) p.setAttachJd(req.getAttachJd());
        if (req.getWalkInStartDate() != null) p.setWalkInStartDate(req.getWalkInStartDate());
        if (req.getWalkInDuration() != null) p.setWalkInDuration(req.getWalkInDuration());
        if (req.getWalkInFrom() != null) p.setWalkInFrom(req.getWalkInFrom());
        if (req.getWalkInTo() != null) p.setWalkInTo(req.getWalkInTo());
        if (req.getRecruiterName() != null) p.setRecruiterName(req.getRecruiterName());
        if (req.getRecruiterContact() != null) p.setRecruiterContact(req.getRecruiterContact());
        if (req.getVenueAddress() != null) p.setVenueAddress(req.getVenueAddress());
        if (req.getVenueMapsLink() != null) p.setVenueMapsLink(req.getVenueMapsLink());
        if (req.getInternshipDuration() != null) p.setInternshipDuration(req.getInternshipDuration());
        if (req.getHasStipend() != null) p.setHasStipend(req.getHasStipend());
        if (req.getStipendAmount() != null) p.setStipendAmount(req.getStipendAmount());
        if (req.getAssessmentMappings() != null) p.setAssessmentMappings(req.getAssessmentMappings());
        if (req.getResumeWeightage() != null) p.setResumeWeightage(req.getResumeWeightage());
        if (req.getRecruitmentSequence() != null) p.setRecruitmentSequence(req.getRecruitmentSequence());
        if (req.getStatus() != null) p.setStatus(JobPosting.Status.valueOf(req.getStatus().toUpperCase()));
        if (req.getInterviewRounds() != null) {
            p.setInterviewRounds(new ArrayList<>());
            req.getInterviewRounds().forEach(ir -> {
                p.getInterviewRounds().add(new JobPosting.InterviewRound(ir.getRoundName(), ir.getMode(), ir.getType()));
            });
        }
        if (req.getCustomQuestions() != null) p.setCustomQuestions(req.getCustomQuestions());
    }

    public List<JobPostingDto.Response> listPublished() {
        return jobRepo.findByStatusOrderByCreatedAtDesc(JobPosting.Status.PUBLISHED)
                .stream().map(JobPostingDto.Response::from).toList();
    }

    public JobPostingDto.Response getPublished(Long id) {
        return jobRepo.findByIdAndStatus(id, JobPosting.Status.PUBLISHED)
                .map(JobPostingDto.Response::from)
                .orElseThrow(() -> new AppException("Job not found", HttpStatus.NOT_FOUND));
    }
}
