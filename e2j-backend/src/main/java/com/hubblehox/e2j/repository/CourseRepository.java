package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByType(Course.CourseType type);

    boolean existsByCategory(String category);

    @Query("SELECT c FROM Course c ORDER BY c.rating DESC")
    List<Course> findAllByRatingDesc();
}
