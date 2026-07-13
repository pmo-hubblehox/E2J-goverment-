package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Student;
import com.hubblehox.e2j.entity.WorkshopEnrollment;
import com.hubblehox.e2j.entity.WorkshopPosting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkshopEnrollmentRepository extends JpaRepository<WorkshopEnrollment, Long> {
    List<WorkshopEnrollment> findByStudentOrderByCreatedAtDesc(Student student);
    List<WorkshopEnrollment> findByWorkshopOrderByCreatedAtAsc(WorkshopPosting workshop);
    List<WorkshopEnrollment> findByWorkshopAndStatus(WorkshopPosting workshop, WorkshopEnrollment.Status status);
    List<WorkshopEnrollment> findByWorkshopAndStatusOrderByWaitlistPositionAsc(WorkshopPosting workshop, WorkshopEnrollment.Status status);
    Optional<WorkshopEnrollment> findByWorkshopAndStudent(WorkshopPosting workshop, Student student);
    long countByWorkshopAndStatus(WorkshopPosting workshop, WorkshopEnrollment.Status status);
}
