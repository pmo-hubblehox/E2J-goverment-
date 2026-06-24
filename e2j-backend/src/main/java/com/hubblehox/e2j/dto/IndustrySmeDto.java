package com.hubblehox.e2j.dto;

import com.hubblehox.e2j.entity.IndustrySme;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class IndustrySmeDto {

    @Data
    public static class Request {
        private String smeName;
        private String expertiseArea;   // JSON array
        private String bio;
        private LocalDate availableFrom;
        private LocalDate availableTo;
        private String recurEvery;
        private String days;            // JSON array
        private String timeSlots;       // JSON array of {from,to}
        private String mode;
        private String locationName;
        private String meetingLink;
        private String status;          // DRAFT | PUBLISHED | UNPUBLISHED
    }

    @Data
    public static class Response {
        private Long id;
        private String smeName;
        private String expertiseArea;
        private String bio;
        private LocalDate availableFrom;
        private LocalDate availableTo;
        private String recurEvery;
        private String days;
        private String timeSlots;
        private String mode;
        private String locationName;
        private String meetingLink;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(IndustrySme s) {
            Response r = new Response();
            r.id = s.getId();
            r.smeName = s.getSmeName();
            r.expertiseArea = s.getExpertiseArea();
            r.bio = s.getBio();
            r.availableFrom = s.getAvailableFrom();
            r.availableTo = s.getAvailableTo();
            r.recurEvery = s.getRecurEvery();
            r.days = s.getDays();
            r.timeSlots = s.getTimeSlots();
            r.mode = s.getMode();
            r.locationName = s.getLocationName();
            r.meetingLink = s.getMeetingLink();
            r.status = s.getStatus() != null ? s.getStatus().name() : null;
            r.createdAt = s.getCreatedAt();
            r.updatedAt = s.getUpdatedAt();
            return r;
        }
    }
}
