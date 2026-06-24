package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.SkillGapReport;
import com.hubblehox.e2j.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SkillGapReportRepository extends JpaRepository<SkillGapReport, Long> {
    List<SkillGapReport> findByStudentOrderByGeneratedAtDesc(Student student);
    Optional<SkillGapReport> findFirstByStudentAndTargetRoleOrderByGeneratedAtDesc(Student student, String targetRole);
    Optional<SkillGapReport> findFirstByStudentAndTargetRoleIgnoreCaseOrderByGeneratedAtDesc(Student student, String targetRole);
}
