package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Counsellor;
import com.hubblehox.e2j.entity.Student;
import com.hubblehox.e2j.entity.StudentBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Set;

public interface StudentBookingRepository extends JpaRepository<StudentBooking, Long> {

    List<StudentBooking> findByStudentOrderByCreatedAtDesc(Student student);
    List<StudentBooking> findByCounsellorOrderByCreatedAtDesc(Counsellor counsellor);

    @Query("SELECT b.sessionDate || '|' || b.sessionTime FROM StudentBooking b WHERE b.counsellor = :counsellor AND b.status <> 'CANCELLED'")
    Set<String> findBookedSlotKeys(Counsellor counsellor);
}
