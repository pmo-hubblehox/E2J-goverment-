package com.hubblehox.e2j.dto;

import com.hubblehox.e2j.entity.IndustryCampusInvite;
import lombok.Data;

import java.time.LocalDateTime;

public class IndustryCampusInviteDto {

    @Data
    public static class Request {
        private Long instituteId;
        private String instituteName;
        private String programName;
        private String stream;
        private String areaOfSpecialization;
        private String naacAccreditation;
        private Integer rating;
        private String employmentType;
        private String targetDate;
        private String eligibilityCriteria;
        private String jobRoles;
        private String driveDate;
        private String driveMode;
        private String venueAddress;
        private String meetingLink;
        private String contactPerson;
        private String contactNumber;
        private String message;
        private String status;
    }

    @Data
    public static class Response {
        private Long id;
        private Long instituteId;
        private String instituteName;
        private String partnerName;
        private String partnerSector;
        private String programName;
        private String stream;
        private String areaOfSpecialization;
        private String naacAccreditation;
        private Integer rating;
        private String employmentType;
        private String targetDate;
        private String eligibilityCriteria;
        private String jobRoles;
        private String driveDate;
        private String driveMode;
        private String venueAddress;
        private String meetingLink;
        private String contactPerson;
        private String contactNumber;
        private String message;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(IndustryCampusInvite i) {
            Response r = new Response();
            r.id = i.getId();
            if (i.getInstitute() != null) {
                r.instituteId = i.getInstitute().getId();
                r.instituteName = i.getInstitute().getName() != null
                        ? i.getInstitute().getName() : i.getInstituteName();
            } else {
                r.instituteName = i.getInstituteName();
            }
            if (i.getPartner() != null) {
                r.partnerName = i.getPartner().getRegisteredName() != null
                        ? i.getPartner().getRegisteredName()
                        : (i.getPartner().getUser() != null ? i.getPartner().getUser().getName() : "—");
                r.partnerSector = i.getPartner().getIndustrySector();
            }
            r.programName = i.getProgramName();
            r.stream = i.getStream();
            r.areaOfSpecialization = i.getAreaOfSpecialization();
            r.naacAccreditation = i.getNaacAccreditation();
            r.rating = i.getRating();
            r.employmentType = i.getEmploymentType();
            r.targetDate = i.getTargetDate();
            r.eligibilityCriteria = i.getEligibilityCriteria();
            r.jobRoles = i.getJobRoles();
            r.driveDate = i.getDriveDate();
            r.driveMode = i.getDriveMode();
            r.venueAddress = i.getVenueAddress();
            r.meetingLink = i.getMeetingLink();
            r.contactPerson = i.getContactPerson();
            r.contactNumber = i.getContactNumber();
            r.message = i.getMessage();
            r.status = i.getStatus() != null ? i.getStatus().name() : null;
            r.createdAt = i.getCreatedAt();
            r.updatedAt = i.getUpdatedAt();
            return r;
        }
    }

    @Data
    public static class InstituteItem {
        private Long id;
        private String name;
        private String city;
        private String state;
        private String type;

        public static InstituteItem from(com.hubblehox.e2j.entity.Institute inst) {
            InstituteItem item = new InstituteItem();
            item.id = inst.getId();
            item.name = inst.getName();
            item.city = inst.getCity();
            item.state = inst.getState();
            item.type = inst.getType();
            return item;
        }
    }
}
