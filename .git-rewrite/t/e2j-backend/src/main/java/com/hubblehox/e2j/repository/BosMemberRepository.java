package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.BosMember;
import com.hubblehox.e2j.entity.Institute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BosMemberRepository extends JpaRepository<BosMember, Long> {
    List<BosMember> findByInstitute(Institute institute);
    Optional<BosMember> findByIdAndInstitute(Long id, Institute institute);
}
