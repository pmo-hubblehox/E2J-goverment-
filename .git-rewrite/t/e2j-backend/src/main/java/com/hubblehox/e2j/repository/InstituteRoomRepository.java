package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.entity.InstituteRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstituteRoomRepository extends JpaRepository<InstituteRoom, Long> {
    List<InstituteRoom> findByInstitute(Institute institute);
    Optional<InstituteRoom> findByIdAndInstitute(Long id, Institute institute);
}
