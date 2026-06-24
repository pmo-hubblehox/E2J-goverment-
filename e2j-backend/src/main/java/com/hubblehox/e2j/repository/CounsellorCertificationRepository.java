package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Counsellor;
import com.hubblehox.e2j.entity.CounsellorCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CounsellorCertificationRepository extends JpaRepository<CounsellorCertification, Long> {
    List<CounsellorCertification> findByCounsellor(Counsellor counsellor);
}
