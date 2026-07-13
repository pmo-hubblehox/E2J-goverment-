package com.hubblehox.e2j.service;

import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.UserRepository;
import com.hubblehox.e2j.repository.WorkshopTrainerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WorkshopTrainerService {

    private final WorkshopTrainerRepository trainerRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public WorkshopTrainer getOrCreateFromIndustrySme(IndustrySme sme) {
        return trainerRepo.findByIndustrySmeId(sme.getId()).orElseGet(() -> {
            if (sme.getEmail() == null || sme.getEmail().isBlank())
                throw new AppException("Add an email for this SME before assigning them as a workshop trainer", HttpStatus.BAD_REQUEST);
            WorkshopTrainer trainer = WorkshopTrainer.builder()
                    .industryPartner(sme.getPartner())
                    .industrySmeId(sme.getId())
                    .name(sme.getSmeName())
                    .email(sme.getEmail())
                    .bio(sme.getBio())
                    .build();
            return trainerRepo.save(provisionUser(trainer));
        });
    }

    @Transactional
    public WorkshopTrainer getOrCreateFromFaculty(Faculty faculty) {
        return trainerRepo.findByFacultyId(faculty.getId()).orElseGet(() -> {
            if (faculty.getEmail() == null || faculty.getEmail().isBlank())
                throw new AppException("Add an email for this Faculty member before assigning them as a workshop trainer", HttpStatus.BAD_REQUEST);
            WorkshopTrainer trainer = WorkshopTrainer.builder()
                    .institute(faculty.getInstitute())
                    .facultyId(faculty.getId())
                    .name(faculty.getName())
                    .email(faculty.getEmail())
                    .bio(faculty.getBio())
                    .build();
            return trainerRepo.save(provisionUser(trainer));
        });
    }

    private WorkshopTrainer provisionUser(WorkshopTrainer trainer) {
        User existing = userRepo.findByEmail(trainer.getEmail()).orElse(null);
        if (existing != null) {
            trainer.setUser(existing);
            return trainer;
        }
        User user = User.builder()
                .email(trainer.getEmail())
                .name(trainer.getName() != null ? trainer.getName() : trainer.getEmail())
                .password(passwordEncoder.encode(trainer.getEmail()))
                .role(User.Role.SME)
                .enabled(true)
                .build();
        trainer.setUser(userRepo.save(user));
        return trainer;
    }
}
