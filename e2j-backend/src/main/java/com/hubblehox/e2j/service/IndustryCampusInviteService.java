package com.hubblehox.e2j.service;

import com.hubblehox.e2j.dto.IndustryCampusInviteDto;
import com.hubblehox.e2j.entity.IndustryCampusInvite;
import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.IndustryCampusInviteRepository;
import com.hubblehox.e2j.repository.IndustryPartnerRepository;
import com.hubblehox.e2j.repository.InstituteRepository;
import com.hubblehox.e2j.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IndustryCampusInviteService {

    private final IndustryCampusInviteRepository inviteRepo;
    private final IndustryPartnerRepository partnerRepo;
    private final InstituteRepository instituteRepo;
    private final UserRepository userRepo;

    private IndustryPartner getPartner(String email) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        return partnerRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Industry partner profile not found", HttpStatus.NOT_FOUND));
    }

    public IndustryCampusInviteDto.Response create(String email, IndustryCampusInviteDto.Request req) {
        IndustryPartner partner = getPartner(email);
        IndustryCampusInvite invite = new IndustryCampusInvite();
        invite.setPartner(partner);
        invite.setStatus(IndustryCampusInvite.Status.INVITED);

        if (req.getInstituteId() != null) {
            Institute institute = instituteRepo.findById(req.getInstituteId())
                    .orElseThrow(() -> new AppException("Institute not found", HttpStatus.NOT_FOUND));
            invite.setInstitute(institute);
            invite.setInstituteName(institute.getName());
        } else if (req.getInstituteName() != null) {
            invite.setInstituteName(req.getInstituteName());
        }

        apply(invite, req);
        return IndustryCampusInviteDto.Response.from(inviteRepo.save(invite));
    }

    public List<IndustryCampusInviteDto.Response> list(String email, String status) {
        IndustryPartner partner = getPartner(email);
        List<IndustryCampusInvite> invites;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            invites = inviteRepo.findByPartnerAndStatusOrderByCreatedAtDesc(partner,
                    IndustryCampusInvite.Status.valueOf(status.toUpperCase()));
        } else {
            invites = inviteRepo.findByPartnerOrderByCreatedAtDesc(partner);
        }
        return invites.stream().map(IndustryCampusInviteDto.Response::from).toList();
    }

    public List<IndustryCampusInviteDto.Response> listForInstitute(Institute institute, String status) {
        List<IndustryCampusInvite> invites;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            invites = inviteRepo.findByInstituteAndStatusOrderByCreatedAtDesc(institute,
                    IndustryCampusInvite.Status.valueOf(status.toUpperCase()));
        } else {
            invites = inviteRepo.findByInstituteOrderByCreatedAtDesc(institute);
        }
        return invites.stream().map(IndustryCampusInviteDto.Response::from).toList();
    }

    public IndustryCampusInviteDto.Response updateStatusByInstitute(Institute institute, Long id, String status) {
        IndustryCampusInvite invite = inviteRepo.findById(id)
                .filter(i -> i.getInstitute() != null && i.getInstitute().getId().equals(institute.getId()))
                .orElseThrow(() -> new AppException("Invite not found", HttpStatus.NOT_FOUND));
        invite.setStatus(IndustryCampusInvite.Status.valueOf(status.toUpperCase()));
        return IndustryCampusInviteDto.Response.from(inviteRepo.save(invite));
    }

    public IndustryCampusInviteDto.Response updateStatus(String email, Long id, String status) {
        IndustryPartner partner = getPartner(email);
        IndustryCampusInvite invite = inviteRepo.findByIdAndPartner(id, partner)
                .orElseThrow(() -> new AppException("Invite not found", HttpStatus.NOT_FOUND));
        invite.setStatus(IndustryCampusInvite.Status.valueOf(status.toUpperCase()));
        return IndustryCampusInviteDto.Response.from(inviteRepo.save(invite));
    }

    public void delete(String email, Long id) {
        IndustryPartner partner = getPartner(email);
        IndustryCampusInvite invite = inviteRepo.findByIdAndPartner(id, partner)
                .orElseThrow(() -> new AppException("Invite not found", HttpStatus.NOT_FOUND));
        inviteRepo.delete(invite);
    }

    public List<IndustryCampusInviteDto.InstituteItem> listApprovedInstitutes() {
        return instituteRepo.findAll().stream()
                .filter(i -> i.getStatus() != null && "APPROVED".equals(i.getStatus().name()))
                .map(IndustryCampusInviteDto.InstituteItem::from)
                .toList();
    }

    private void apply(IndustryCampusInvite i, IndustryCampusInviteDto.Request r) {
        if (r.getProgramName() != null) i.setProgramName(r.getProgramName());
        if (r.getStream() != null) i.setStream(r.getStream());
        if (r.getAreaOfSpecialization() != null) i.setAreaOfSpecialization(r.getAreaOfSpecialization());
        if (r.getNaacAccreditation() != null) i.setNaacAccreditation(r.getNaacAccreditation());
        if (r.getRating() != null) i.setRating(r.getRating());
        if (r.getEmploymentType() != null) i.setEmploymentType(r.getEmploymentType());
        if (r.getTargetDate() != null) i.setTargetDate(r.getTargetDate());
        if (r.getEligibilityCriteria() != null) i.setEligibilityCriteria(r.getEligibilityCriteria());
        if (r.getJobRoles() != null) i.setJobRoles(r.getJobRoles());
        if (r.getDriveDate() != null) i.setDriveDate(r.getDriveDate());
        if (r.getDriveMode() != null) i.setDriveMode(r.getDriveMode());
        if (r.getVenueAddress() != null) i.setVenueAddress(r.getVenueAddress());
        if (r.getMeetingLink() != null) i.setMeetingLink(r.getMeetingLink());
        if (r.getContactPerson() != null) i.setContactPerson(r.getContactPerson());
        if (r.getContactNumber() != null) i.setContactNumber(r.getContactNumber());
        if (r.getMessage() != null) i.setMessage(r.getMessage());
        if (r.getStatus() != null) i.setStatus(IndustryCampusInvite.Status.valueOf(r.getStatus().toUpperCase()));
    }
}
