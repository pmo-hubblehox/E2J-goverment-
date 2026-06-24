package com.hubblehox.e2j.service;

import com.hubblehox.e2j.dto.IndustrySmeDto;
import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.IndustrySme;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.IndustryPartnerRepository;
import com.hubblehox.e2j.repository.IndustrySmeRepository;
import com.hubblehox.e2j.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IndustrySmeService {

    private final IndustrySmeRepository smeRepo;
    private final IndustryPartnerRepository partnerRepo;
    private final UserRepository userRepo;

    private IndustryPartner getPartner(String email) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        return partnerRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Industry partner profile not found", HttpStatus.NOT_FOUND));
    }

    public IndustrySmeDto.Response create(String email, IndustrySmeDto.Request req) {
        IndustryPartner partner = getPartner(email);
        IndustrySme sme = new IndustrySme();
        sme.setPartner(partner);
        apply(sme, req);
        return IndustrySmeDto.Response.from(smeRepo.save(sme));
    }

    public List<IndustrySmeDto.Response> list(String email) {
        IndustryPartner partner = getPartner(email);
        return smeRepo.findByPartnerOrderByCreatedAtDesc(partner)
                .stream().map(IndustrySmeDto.Response::from).toList();
    }

    public IndustrySmeDto.Response get(String email, Long id) {
        IndustryPartner partner = getPartner(email);
        return IndustrySmeDto.Response.from(smeRepo.findByIdAndPartner(id, partner)
                .orElseThrow(() -> new AppException("SME not found", HttpStatus.NOT_FOUND)));
    }

    public IndustrySmeDto.Response update(String email, Long id, IndustrySmeDto.Request req) {
        IndustryPartner partner = getPartner(email);
        IndustrySme sme = smeRepo.findByIdAndPartner(id, partner)
                .orElseThrow(() -> new AppException("SME not found", HttpStatus.NOT_FOUND));
        apply(sme, req);
        return IndustrySmeDto.Response.from(smeRepo.save(sme));
    }

    public void delete(String email, Long id) {
        IndustryPartner partner = getPartner(email);
        IndustrySme sme = smeRepo.findByIdAndPartner(id, partner)
                .orElseThrow(() -> new AppException("SME not found", HttpStatus.NOT_FOUND));
        smeRepo.delete(sme);
    }

    private void apply(IndustrySme s, IndustrySmeDto.Request r) {
        if (r.getSmeName() != null) s.setSmeName(r.getSmeName());
        if (r.getExpertiseArea() != null) s.setExpertiseArea(r.getExpertiseArea());
        if (r.getBio() != null) s.setBio(r.getBio());
        if (r.getAvailableFrom() != null) s.setAvailableFrom(r.getAvailableFrom());
        if (r.getAvailableTo() != null) s.setAvailableTo(r.getAvailableTo());
        if (r.getRecurEvery() != null) s.setRecurEvery(r.getRecurEvery());
        if (r.getDays() != null) s.setDays(r.getDays());
        if (r.getTimeSlots() != null) s.setTimeSlots(r.getTimeSlots());
        if (r.getMode() != null) s.setMode(r.getMode());
        if (r.getLocationName() != null) s.setLocationName(r.getLocationName());
        if (r.getMeetingLink() != null) s.setMeetingLink(r.getMeetingLink());
        if (r.getStatus() != null) s.setStatus(IndustrySme.Status.valueOf(r.getStatus().toUpperCase()));
    }
}
