package com.hubblehox.e2j.dto;

import com.hubblehox.e2j.entity.CurriculumApproval;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CurriculumApprovalDto {

    private Long id;
    private String decision;
    private String remarks;
    private LocalDateTime decidedAt;
    private LocalDateTime createdAt;
    private CurriculumInfo curriculum;
    private BosMemberInfo bosMember;

    @Data
    public static class CurriculumInfo {
        private Long id;
        private String programName;
        private String major;
        private String degree;
        private String academicYear;
        private String status;
    }

    @Data
    public static class BosMemberInfo {
        private String name;
        private String designation;
        private String organization;
    }

    public static CurriculumApprovalDto from(CurriculumApproval a) {
        CurriculumApprovalDto dto = new CurriculumApprovalDto();
        dto.setId(a.getId());
        dto.setDecision(a.getDecision().name());
        dto.setRemarks(a.getRemarks());
        dto.setDecidedAt(a.getDecidedAt());
        dto.setCreatedAt(a.getCreatedAt());

        if (a.getCurriculum() != null) {
            CurriculumInfo ci = new CurriculumInfo();
            ci.setId(a.getCurriculum().getId());
            ci.setProgramName(a.getCurriculum().getProgramName());
            ci.setMajor(a.getCurriculum().getMajor());
            ci.setDegree(a.getCurriculum().getDegree());
            ci.setAcademicYear(a.getCurriculum().getAcademicYear());
            ci.setStatus(a.getCurriculum().getStatus() != null ? a.getCurriculum().getStatus().name() : null);
            dto.setCurriculum(ci);
        }

        if (a.getBosMember() != null) {
            BosMemberInfo bmi = new BosMemberInfo();
            bmi.setName(a.getBosMember().getName());
            bmi.setDesignation(a.getBosMember().getDesignation());
            bmi.setOrganization(a.getBosMember().getOrganization());
            dto.setBosMember(bmi);
        }

        return dto;
    }
}
