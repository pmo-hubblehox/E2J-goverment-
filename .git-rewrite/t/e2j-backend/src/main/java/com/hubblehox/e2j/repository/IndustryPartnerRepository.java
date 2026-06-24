package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IndustryPartnerRepository extends JpaRepository<IndustryPartner, Long> {
    Optional<IndustryPartner> findByUser(User user);
    Optional<IndustryPartner> findByUser_Email(String email);
}
