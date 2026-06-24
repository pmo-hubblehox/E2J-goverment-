package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class IndustryVenueController {

    private final IndustryPartnerRepository partnerRepo;
    private final InstituteRepository       instituteRepo;
    private final IndustryVenueRepository   venueRepo;
    private final IndustryVenueSlotRepository slotRepo;
    private final LabBookingRequestRepository bookingRepo;

    private IndustryPartner getPartner(User user) {
        return partnerRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Industry partner not found", HttpStatus.NOT_FOUND));
    }

    private Institute getInstitute(User user) {
        return instituteRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Institute not found", HttpStatus.NOT_FOUND));
    }

    private Map<String, Object> venueMap(IndustryVenue v) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", v.getId());
        m.put("name", v.getName());
        m.put("venueType", v.getVenueType());
        m.put("capacity", v.getCapacity());
        m.put("location", v.getLocation());
        m.put("address", v.getAddress());
        m.put("description", v.getDescription());
        m.put("amenities", v.getAmenities());
        m.put("active", v.isActive());
        m.put("createdAt", v.getCreatedAt());
        return m;
    }

    private Map<String, Object> slotMap(IndustryVenueSlot s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("venueId", s.getVenue().getId());
        m.put("venueName", s.getVenue().getName());
        m.put("companyName", s.getVenue().getIndustryPartner().getRegisteredName());
        m.put("venueType", s.getVenue().getVenueType());
        m.put("venueLocation", s.getVenue().getLocation());
        m.put("capacity", s.getVenue().getCapacity());
        m.put("amenities", s.getVenue().getAmenities());
        m.put("date", s.getDate());
        m.put("startTime", s.getStartTime());
        m.put("endTime", s.getEndTime());
        m.put("status", s.getStatus());
        m.put("notes", s.getNotes());
        m.put("createdAt", s.getCreatedAt());
        List<Map<String, Object>> acceptedBookings = bookingRepo.findBySlotOrderByRequestedAtDesc(s).stream()
                .filter(r -> r.getStatus() == LabBookingRequest.RequestStatus.ACCEPTED)
                .map(r -> {
                    Map<String, Object> bm = new LinkedHashMap<>();
                    bm.put("id", r.getId());
                    bm.put("instituteName", r.getInstitute().getName());
                    bm.put("requestedStartTime", r.getRequestedStartTime() != null ? r.getRequestedStartTime().toString() : null);
                    bm.put("requestedEndTime", r.getRequestedEndTime() != null ? r.getRequestedEndTime().toString() : null);
                    bm.put("purpose", r.getPurpose());
                    return bm;
                }).toList();
        m.put("acceptedBookings", acceptedBookings);
        m.put("hasAcceptedBookings", !acceptedBookings.isEmpty());
        return m;
    }

    private Map<String, Object> bookingMap(LabBookingRequest r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("slotId", r.getSlot().getId());
        m.put("venueName", r.getSlot().getVenue().getName());
        m.put("companyName", r.getSlot().getVenue().getIndustryPartner().getRegisteredName());
        m.put("venueType", r.getSlot().getVenue().getVenueType());
        m.put("venueLocation", r.getSlot().getVenue().getLocation());
        m.put("date", r.getSlot().getDate());
        m.put("slotStartTime", r.getSlot().getStartTime());
        m.put("slotEndTime", r.getSlot().getEndTime());
        m.put("requestedStartTime", r.getRequestedStartTime() != null ? r.getRequestedStartTime().toString() : null);
        m.put("requestedEndTime", r.getRequestedEndTime() != null ? r.getRequestedEndTime().toString() : null);
        m.put("instituteName", r.getInstitute().getName());
        m.put("purpose", r.getPurpose());
        m.put("status", r.getStatus());
        m.put("rejectionReason", r.getRejectionReason());
        m.put("requestedAt", r.getRequestedAt());
        m.put("respondedAt", r.getRespondedAt());
        return m;
    }

    // ── INDUSTRY: Venue CRUD ──────────────────────────────────────────────────

    @GetMapping("/industry/venues")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listVenues(
            @AuthenticationPrincipal User user) {
        IndustryPartner partner = getPartner(user);
        return ResponseEntity.ok(ApiResponse.ok(
                venueRepo.findByIndustryPartnerOrderByCreatedAtDesc(partner)
                        .stream().map(this::venueMap).collect(Collectors.toList())));
    }

    @PostMapping("/industry/venues")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addVenue(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        IndustryPartner partner = getPartner(user);
        IndustryVenue v = IndustryVenue.builder()
                .industryPartner(partner)
                .name((String) body.get("name"))
                .venueType((String) body.get("venueType"))
                .capacity(body.get("capacity") != null ? ((Number) body.get("capacity")).intValue() : null)
                .location((String) body.get("location"))
                .address((String) body.get("address"))
                .description((String) body.get("description"))
                .amenities((String) body.get("amenities"))
                .build();
        return ResponseEntity.ok(ApiResponse.ok(venueMap(venueRepo.save(v)), "Venue added"));
    }

    @PutMapping("/industry/venues/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateVenue(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        IndustryPartner partner = getPartner(user);
        IndustryVenue v = venueRepo.findByIdAndIndustryPartner(id, partner)
                .orElseThrow(() -> new AppException("Venue not found", HttpStatus.NOT_FOUND));
        if (body.containsKey("name"))        v.setName((String) body.get("name"));
        if (body.containsKey("venueType"))   v.setVenueType((String) body.get("venueType"));
        if (body.containsKey("capacity"))    v.setCapacity(((Number) body.get("capacity")).intValue());
        if (body.containsKey("location"))    v.setLocation((String) body.get("location"));
        if (body.containsKey("address"))     v.setAddress((String) body.get("address"));
        if (body.containsKey("description")) v.setDescription((String) body.get("description"));
        if (body.containsKey("amenities"))   v.setAmenities((String) body.get("amenities"));
        if (body.containsKey("active"))      v.setActive((Boolean) body.get("active"));
        return ResponseEntity.ok(ApiResponse.ok(venueMap(venueRepo.save(v)), "Updated"));
    }

    @DeleteMapping("/industry/venues/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVenue(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        IndustryPartner partner = getPartner(user);
        IndustryVenue v = venueRepo.findByIdAndIndustryPartner(id, partner)
                .orElseThrow(() -> new AppException("Venue not found", HttpStatus.NOT_FOUND));
        venueRepo.delete(v);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    // ── INDUSTRY: Slot management ─────────────────────────────────────────────

    @GetMapping("/industry/venues/{venueId}/slots")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listSlots(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId) {
        IndustryPartner partner = getPartner(user);
        IndustryVenue v = venueRepo.findByIdAndIndustryPartner(venueId, partner)
                .orElseThrow(() -> new AppException("Venue not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(
                slotRepo.findByVenueOrderByDateAscStartTimeAsc(v)
                        .stream().map(this::slotMap).collect(Collectors.toList())));
    }

    @PostMapping("/industry/venues/{venueId}/slots")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addSlot(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId,
            @RequestBody Map<String, Object> body) {
        IndustryPartner partner = getPartner(user);
        IndustryVenue v = venueRepo.findByIdAndIndustryPartner(venueId, partner)
                .orElseThrow(() -> new AppException("Venue not found", HttpStatus.NOT_FOUND));
        IndustryVenueSlot slot = IndustryVenueSlot.builder()
                .venue(v)
                .date(LocalDate.parse((String) body.get("date")))
                .startTime(LocalTime.parse((String) body.get("startTime")))
                .endTime(LocalTime.parse((String) body.get("endTime")))
                .notes((String) body.get("notes"))
                .build();
        return ResponseEntity.ok(ApiResponse.ok(slotMap(slotRepo.save(slot)), "Slot added"));
    }

    @DeleteMapping("/industry/slots/{slotId}")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(
            @AuthenticationPrincipal User user,
            @PathVariable Long slotId) {
        IndustryPartner partner = getPartner(user);
        IndustryVenueSlot slot = slotRepo.findById(slotId)
                .filter(s -> s.getVenue().getIndustryPartner().getId().equals(partner.getId()))
                .orElseThrow(() -> new AppException("Slot not found", HttpStatus.NOT_FOUND));
        boolean hasAccepted = bookingRepo.findBySlotOrderByRequestedAtDesc(slot).stream()
                .anyMatch(r -> r.getStatus() == LabBookingRequest.RequestStatus.ACCEPTED);
        if (hasAccepted)
            throw new AppException("Cannot delete a slot with accepted bookings", HttpStatus.CONFLICT);
        slotRepo.delete(slot);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    // ── INDUSTRY: Booking requests ────────────────────────────────────────────

    @GetMapping("/industry/booking-requests")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRequests(
            @AuthenticationPrincipal User user) {
        IndustryPartner partner = getPartner(user);
        return ResponseEntity.ok(ApiResponse.ok(
                bookingRepo.findByIndustryPartnerId(partner.getId())
                        .stream().map(this::bookingMap).collect(Collectors.toList())));
    }

    @PostMapping("/industry/booking-requests/{id}/accept")
    public ResponseEntity<ApiResponse<Map<String, Object>>> acceptRequest(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        IndustryPartner partner = getPartner(user);
        LabBookingRequest req = bookingRepo.findById(id)
                .filter(r -> r.getSlot().getVenue().getIndustryPartner().getId().equals(partner.getId()))
                .orElseThrow(() -> new AppException("Request not found", HttpStatus.NOT_FOUND));
        req.setStatus(LabBookingRequest.RequestStatus.ACCEPTED);
        req.setRespondedAt(LocalDateTime.now());
        IndustryVenueSlot slot = req.getSlot();
        // Auto-reject only requests whose time OVERLAPS with this accepted booking
        LocalTime aStart = req.getRequestedStartTime();
        LocalTime aEnd   = req.getRequestedEndTime();
        bookingRepo.findBySlotOrderByRequestedAtDesc(slot).stream()
                .filter(r -> !r.getId().equals(id) && r.getStatus() == LabBookingRequest.RequestStatus.PENDING)
                .filter(r -> r.getRequestedStartTime() != null && r.getRequestedEndTime() != null
                          && aStart.isBefore(r.getRequestedEndTime()) && aEnd.isAfter(r.getRequestedStartTime()))
                .forEach(r -> {
                    r.setStatus(LabBookingRequest.RequestStatus.REJECTED);
                    r.setRejectionReason("Time window " + aStart + "–" + aEnd + " was booked by another institute.");
                    r.setRespondedAt(LocalDateTime.now());
                    bookingRepo.save(r);
                });
        // Check if entire slot window is now covered by accepted bookings
        long coveredMinutes = bookingRepo.findBySlotOrderByRequestedAtDesc(slot).stream()
                .filter(r -> r.getStatus() == LabBookingRequest.RequestStatus.ACCEPTED)
                .mapToLong(r -> java.time.Duration.between(r.getRequestedStartTime(), r.getRequestedEndTime()).toMinutes())
                .sum();
        long totalMinutes = java.time.Duration.between(slot.getStartTime(), slot.getEndTime()).toMinutes();
        slot.setStatus(coveredMinutes >= totalMinutes ? IndustryVenueSlot.SlotStatus.BOOKED : IndustryVenueSlot.SlotStatus.AVAILABLE);
        slotRepo.save(slot);
        return ResponseEntity.ok(ApiResponse.ok(bookingMap(bookingRepo.save(req)), "Accepted"));
    }

    @PostMapping("/industry/booking-requests/{id}/reject")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejectRequest(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        IndustryPartner partner = getPartner(user);
        LabBookingRequest req = bookingRepo.findById(id)
                .filter(r -> r.getSlot().getVenue().getIndustryPartner().getId().equals(partner.getId()))
                .orElseThrow(() -> new AppException("Request not found", HttpStatus.NOT_FOUND));
        req.setStatus(LabBookingRequest.RequestStatus.REJECTED);
        req.setRejectionReason((String) body.get("reason"));
        req.setRespondedAt(LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.ok(bookingMap(bookingRepo.save(req)), "Rejected"));
    }

    // ── INSTITUTE: Browse & Book ──────────────────────────────────────────────

    @GetMapping("/institute/lab-slots")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> browseSlots(
            @AuthenticationPrincipal User user) {
        getInstitute(user); // auth check
        List<IndustryVenueSlot> slots = slotRepo.findAvailableFrom(LocalDate.now());
        return ResponseEntity.ok(ApiResponse.ok(
                slots.stream().map(this::slotMap).collect(Collectors.toList())));
    }

    @PostMapping("/institute/lab-slots/{slotId}/book")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bookSlot(
            @AuthenticationPrincipal User user,
            @PathVariable Long slotId,
            @RequestBody Map<String, Object> body) {
        Institute institute = getInstitute(user);
        IndustryVenueSlot slot = slotRepo.findById(slotId)
                .orElseThrow(() -> new AppException("Slot not found", HttpStatus.NOT_FOUND));
        if (slot.getStatus() == IndustryVenueSlot.SlotStatus.BOOKED)
            throw new AppException("Slot is fully booked", HttpStatus.CONFLICT);

        // Prevent duplicate pending requests from same institute for overlapping times
        boolean alreadyRequested = bookingRepo.findBySlotOrderByRequestedAtDesc(slot).stream()
                .filter(r -> r.getInstitute().getId().equals(institute.getId()) && r.getStatus() == LabBookingRequest.RequestStatus.PENDING)
                .anyMatch(r -> r.getRequestedStartTime() != null);
        if (alreadyRequested)
            throw new AppException("You already have a pending request for this slot", HttpStatus.CONFLICT);

        LocalTime reqStart = LocalTime.parse((String) body.get("requestedStartTime"));
        LocalTime reqEnd   = LocalTime.parse((String) body.get("requestedEndTime"));

        if (!reqStart.isBefore(reqEnd))
            throw new AppException("Start time must be before end time", HttpStatus.BAD_REQUEST);
        if (reqStart.isBefore(slot.getStartTime()) || reqEnd.isAfter(slot.getEndTime()))
            throw new AppException("Requested time must be within slot window (" + slot.getStartTime() + " – " + slot.getEndTime() + ")", HttpStatus.BAD_REQUEST);

        // Check overlap with already ACCEPTED bookings for this slot
        boolean overlaps = bookingRepo.findBySlotOrderByRequestedAtDesc(slot).stream()
                .filter(r -> r.getStatus() == LabBookingRequest.RequestStatus.ACCEPTED)
                .anyMatch(r -> reqStart.isBefore(r.getRequestedEndTime()) && reqEnd.isAfter(r.getRequestedStartTime()));
        if (overlaps)
            throw new AppException("This time window overlaps with an already accepted booking", HttpStatus.CONFLICT);

        LabBookingRequest req = LabBookingRequest.builder()
                .slot(slot)
                .institute(institute)
                .requestedStartTime(reqStart)
                .requestedEndTime(reqEnd)
                .purpose((String) body.get("purpose"))
                .build();
        // Slot stays AVAILABLE — only blocked after industry partner accepts
        return ResponseEntity.ok(ApiResponse.ok(bookingMap(bookingRepo.save(req)), "Booking request sent"));
    }

    @GetMapping("/institute/lab-bookings")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> myBookings(
            @AuthenticationPrincipal User user) {
        Institute institute = getInstitute(user);
        return ResponseEntity.ok(ApiResponse.ok(
                bookingRepo.findByInstituteOrderByRequestedAtDesc(institute)
                        .stream().map(this::bookingMap).collect(Collectors.toList())));
    }
}
