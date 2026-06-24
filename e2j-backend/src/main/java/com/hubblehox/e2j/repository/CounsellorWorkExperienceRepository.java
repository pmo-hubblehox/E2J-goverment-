package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Counsellor;
import com.hubblehox.e2j.entity.CounsellorWorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CounsellorWorkExperienceRepository extends JpaRepository<CounsellorWorkExperience, Long> {
    List<CounsellorWorkExperience> findByCounsellor(Counsellor counsellor);
}
