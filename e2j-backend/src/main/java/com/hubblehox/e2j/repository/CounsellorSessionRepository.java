package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Counsellor;
import com.hubblehox.e2j.entity.CounsellorSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CounsellorSessionRepository extends JpaRepository<CounsellorSession, Long> {
    Page<CounsellorSession> findByCounsellor(Counsellor counsellor, Pageable pageable);
    Page<CounsellorSession> findByCounsellorAndStatus(Counsellor counsellor, CounsellorSession.Status status, Pageable pageable);
    long countByCounsellorAndStatus(Counsellor counsellor, CounsellorSession.Status status);
    long countByCounsellor(Counsellor counsellor);
    List<CounsellorSession> findByCounsellorOrderByCreatedAtDesc(Counsellor counsellor);
}
