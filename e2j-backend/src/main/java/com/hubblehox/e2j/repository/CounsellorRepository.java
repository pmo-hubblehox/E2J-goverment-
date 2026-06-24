package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Counsellor;
import com.hubblehox.e2j.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CounsellorRepository extends JpaRepository<Counsellor, Long> {
    Optional<Counsellor> findByUser(User user);
    List<Counsellor> findByOnboardingCompletedTrueAndStatus(Counsellor.Status status);
    List<Counsellor> findByStatus(Counsellor.Status status);
    List<Counsellor> findByPendingProfileUpdateTrue();
}
