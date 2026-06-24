package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Curriculum;
import com.hubblehox.e2j.entity.Institute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {

    Page<Curriculum> findByInstitute(Institute institute, Pageable pageable);

    /** All versions for a program (all majors), newest first — used by version history panel. */
    List<Curriculum> findByInstituteAndProgramIdOrderByVersionDesc(Institute institute, Long programId);

    /** All versions for a specific program + major combination, newest first. */
    List<Curriculum> findByInstituteAndProgramIdAndMajorOrderByVersionDesc(Institute institute, Long programId, String major);

    /** Latest version for a specific program + major — used for dedup check and AI versioning. */
    Optional<Curriculum> findTopByInstituteAndProgramIdAndMajorOrderByVersionDesc(Institute institute, Long programId, String major);

    boolean existsByInstituteAndProgramIdAndMajor(Institute institute, Long programId, String major);

    /**
     * Returns one row per (programId, major) — the latest version each.
     * This is what the curriculum list shows.
     */
    @Query("""
        SELECT c FROM Curriculum c
        WHERE c.institute = :institute
          AND c.version = (
              SELECT MAX(c2.version) FROM Curriculum c2
              WHERE c2.institute = :institute
                AND c2.programId = c.programId
                AND c2.major = c.major
          )
        ORDER BY c.createdAt DESC NULLS LAST
        """)
    List<Curriculum> findLatestVersionPerProgram(@Param("institute") Institute institute);

    /** All versions for a given programId across all majors, newest first — version history drawer. */
    @Query("""
        SELECT c FROM Curriculum c
        WHERE c.institute = :institute AND c.programId = :programId
        ORDER BY c.major ASC, c.version DESC
        """)
    List<Curriculum> findAllVersionsByProgramId(@Param("institute") Institute institute, @Param("programId") Long programId);
}
