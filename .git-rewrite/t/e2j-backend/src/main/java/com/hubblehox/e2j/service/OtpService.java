package com.hubblehox.e2j.service;

import com.hubblehox.e2j.entity.OtpToken;
import com.hubblehox.e2j.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();

    @Value("${app.otp.expiry-minutes}")
    private int otpExpiryMinutes;

    public String generateAndSendOtp(String email) {
        otpTokenRepository.deleteAllByEmail(email);

        String otp = String.format("%06d", random.nextInt(1_000_000));

        OtpToken token = OtpToken.builder()
                .email(email)
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .used(false)
                .build();
        otpTokenRepository.save(token);

        sendOtpEmail(email, otp);
        log.info("OTP for {} : {}", email, otp);
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        return otpTokenRepository
                .findTopByEmailAndUsedFalseOrderByCreatedAtDesc(email)
                .map(t -> !t.isExpired() && t.getOtp().equals(otp))
                .orElse(false);
    }

    public void markUsed(String email) {
        otpTokenRepository
                .findTopByEmailAndUsedFalseOrderByCreatedAtDesc(email)
                .ifPresent(t -> {
                    t.setUsed(true);
                    otpTokenRepository.save(t);
                });
    }

    private void sendOtpEmail(String to, String otp) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject("HubbleHox E2J — Your OTP Code");
            msg.setText("Your OTP is: " + otp + "\n\nValid for " + otpExpiryMinutes + " minutes.\n\nDo not share this code.");
            mailSender.send(msg);
        } catch (Exception e) {
            log.warn("Could not send OTP email to {}: {}", to, e.getMessage());
        }
    }
}
