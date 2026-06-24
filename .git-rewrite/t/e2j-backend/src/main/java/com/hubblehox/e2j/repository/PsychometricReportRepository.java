package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.PsychometricReport;
import com.hubblehox.e2j.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PsychometricReportRepository extends JpaRepository<PsychometricReport, Long> {

    List<PsychometricReport> findByStudentOrderByCreatedAtDesc(Student student);

    Optional<PsychometricReport> findTopByStudentOrderByCreatedAtDesc(Student student);
}
