package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.WorkshopEnrollment;
import com.hubblehox.e2j.entity.WorkshopPosting;
import com.hubblehox.e2j.entity.WorkshopReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface WorkshopReviewRepository extends JpaRepository<WorkshopReview, Long> {
    Optional<WorkshopReview> findByEnrollment(WorkshopEnrollment enrollment);

    @Query("SELECT r FROM WorkshopReview r WHERE r.enrollment.workshop = :workshop")
    List<WorkshopReview> findByWorkshop(WorkshopPosting workshop);

    @Query("SELECT AVG(r.overallRating) FROM WorkshopReview r WHERE r.enrollment.workshop = :workshop")
    Double computeAverageRating(WorkshopPosting workshop);
}
