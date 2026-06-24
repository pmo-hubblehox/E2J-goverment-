package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Counsellor;
import com.hubblehox.e2j.entity.CounsellorEducation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CounsellorEducationRepository extends JpaRepository<CounsellorEducation, Long> {
    List<CounsellorEducation> findByCounsellor(Counsellor counsellor);
}
