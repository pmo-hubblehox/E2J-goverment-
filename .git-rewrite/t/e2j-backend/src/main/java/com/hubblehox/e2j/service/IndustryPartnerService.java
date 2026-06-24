package com.hubblehox.e2j.service;

import com.hubblehox.e2j.dto.IndustryPartnerDto;
import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.IndustryPartnerRepository;
import com.hubblehox.e2j.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class IndustryPartnerService {

    private final IndustryPartnerRepository industryPartnerRepository;
    private final UserRepository userRepository;

    public boolean isOnboardingCompleted(String email) {
        IndustryPartner partner = findByEmail(email);
        return partner.getApplicationStatus() != IndustryPartner.ApplicationStatus.DRAFT;
    }

    public IndustryPartnerDto.ApplicationResponse getApplication(String email) {
        IndustryPartner partner = findByEmail(email);
        return IndustryPartnerDto.toResponse(partner);
    }

    public IndustryPartnerDto.StatusResponse getStatus(String email) {
        IndustryPartner partner = findByEmail(email);
        return IndustryPartnerDto.StatusResponse.builder()
                .applicationStatus(partner.getApplicationStatus().name())
                .submittedAt(partner.getSubmittedAt())
                .rejectionReason(partner.getRejectionReason())
                .build();
    }

    @Transactional
    public IndustryPartnerDto.ApplicationResponse saveApplication(String email, IndustryPartnerDto.ApplicationRequest req) {
        IndustryPartner partner = findByEmail(email);

        partner.setRegisteredName(req.getRegisteredName());
        partner.setRegisteringAs(req.getRegisteringAs());
        partner.setIndustrySector(req.getIndustrySector());
        partner.setOrganizationSize(req.getOrganizationSize());
        partner.setWebsiteUrl(req.getWebsiteUrl());
        partner.setOnlinePaymentLink(req.getOnlinePaymentLink());

        partner.setHouseNumber(req.getHouseNumber());
        partner.setFlatFloor(req.getFlatFloor());
        partner.setCountry(req.getCountry());
        partner.setPinCode(req.getPinCode());
        partner.setState(req.getState());
        partner.setDistrict(req.getDistrict());
        partner.setCity(req.getCity());
        partner.setTaluka(req.getTaluka());
        partner.setAreaLocality(req.getAreaLocality());
        partner.setLandmark(req.getLandmark());

        partner.setPan(req.getPan());
        partner.setTaxId(req.getTaxId());
        partner.setNumberOfEmployees(req.getNumberOfEmployees());
        partner.setAnnualRevenue(req.getAnnualRevenue());
        partner.setJobRolesAvailable(req.getJobRolesAvailable());
        partner.setEmployeeBenefits(req.getEmployeeBenefits());
        partner.setRecruitmentVision(req.getRecruitmentVision());
        partner.setTrainingSectors(req.getTrainingSectors());
        partner.setTrainingMethods(req.getTrainingMethods());
        partner.setTrainingVision(req.getTrainingVision());

        if (req.getPanDocUrl()  != null) partner.setPanDocUrl(req.getPanDocUrl());
        if (req.getGstDocUrl()  != null) partner.setGstDocUrl(req.getGstDocUrl());
        if (req.getTanDocUrl()  != null) partner.setTanDocUrl(req.getTanDocUrl());
        if (req.getCinDocUrl()  != null) partner.setCinDocUrl(req.getCinDocUrl());
        if (req.getBrochureUrl() != null) partner.setBrochureUrl(req.getBrochureUrl());

        if (req.getSpocDetails() != null) {
            partner.getSpocDetails().clear();
            req.getSpocDetails().forEach(s -> partner.getSpocDetails().add(
                    IndustryPartner.SpocDetail.builder()
                            .contactType(s.getContactType())
                            .contactPersonName(s.getContactPersonName())
                            .emailAddress(s.getEmailAddress())
                            .contactNumber(s.getContactNumber())
                            .build()));
        }

        industryPartnerRepository.save(partner);
        return IndustryPartnerDto.toResponse(partner);
    }

    @Transactional
    public IndustryPartnerDto.StatusResponse submitApplication(String email) {
        IndustryPartner partner = findByEmail(email);

        if (partner.getApplicationStatus() == IndustryPartner.ApplicationStatus.SUBMITTED ||
            partner.getApplicationStatus() == IndustryPartner.ApplicationStatus.UNDER_REVIEW ||
            partner.getApplicationStatus() == IndustryPartner.ApplicationStatus.APPROVED) {
            throw new AppException("Application already submitted.", HttpStatus.CONFLICT);
        }

        partner.setApplicationStatus(IndustryPartner.ApplicationStatus.SUBMITTED);
        partner.setSubmittedAt(LocalDateTime.now());
        industryPartnerRepository.save(partner);

        return IndustryPartnerDto.StatusResponse.builder()
                .applicationStatus(partner.getApplicationStatus().name())
                .submittedAt(partner.getSubmittedAt())
                .build();
    }

    private IndustryPartner findByEmail(String email) {
        return industryPartnerRepository.findByUser_Email(email)
                .orElseThrow(() -> new AppException("Industry partner profile not found.", HttpStatus.NOT_FOUND));
    }
}
