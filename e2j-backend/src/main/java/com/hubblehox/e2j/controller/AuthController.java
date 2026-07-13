package com.hubblehox.e2j.controller;

import com.hubblehox.e2j.dto.ApiResponse;
import com.hubblehox.e2j.dto.AuthDto;
import com.hubblehox.e2j.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Student registration — Step 1: send OTP
    @PostMapping("/student/register/otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody AuthDto.SendOtpRequest req) {
        String otp = authService.sendStudentOtp(req.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(otp, "OTP sent successfully"));
    }

    // Student registration — Step 2: verify OTP
    @PostMapping("/student/register/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody AuthDto.VerifyOtpRequest req) {
        authService.verifyStudentOtp(req.getEmail(), req.getOtp());
        return ResponseEntity.ok(ApiResponse.ok(null, "OTP verified"));
    }

    // Student registration — Step 3: set password
    @PostMapping("/student/register/set-password")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> setPassword(@Valid @RequestBody AuthDto.SetPasswordRequest req) {
        AuthDto.LoginResponse response = authService.setStudentPassword(req.getEmail(), req.getOtp(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Registration complete"));
    }

    // Student login
    @PostMapping("/student/login")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> studentLogin(@Valid @RequestBody AuthDto.LoginRequest req) {
        AuthDto.LoginResponse response = authService.loginStudent(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }

    // Institute registration — Step 1: send OTP
    @PostMapping("/institute/register/otp")
    public ResponseEntity<ApiResponse<String>> sendInstituteOtp(@Valid @RequestBody AuthDto.SendOtpRequest req) {
        String otp = authService.sendInstituteOtp(req.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(otp, "OTP sent successfully"));
    }

    // Institute registration — Step 2: verify OTP
    @PostMapping("/institute/register/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyInstituteOtp(@Valid @RequestBody AuthDto.VerifyOtpRequest req) {
        authService.verifyInstituteOtp(req.getEmail(), req.getOtp());
        return ResponseEntity.ok(ApiResponse.ok(null, "OTP verified"));
    }

    // Institute registration — Step 3: set password
    @PostMapping("/institute/register/set-password")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> setInstitutePassword(@Valid @RequestBody AuthDto.SetPasswordRequest req) {
        AuthDto.LoginResponse response = authService.setInstitutePassword(req.getEmail(), req.getOtp(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Registration complete"));
    }

    // Institute admin login
    @PostMapping("/institute/login")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> instituteLogin(@Valid @RequestBody AuthDto.LoginRequest req) {
        AuthDto.LoginResponse response = authService.loginInstitute(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }

    // ── Counsellor auth ───────────────────────────────────────────────────────

    @PostMapping("/counsellor/register/otp")
    public ResponseEntity<ApiResponse<String>> sendCounsellorOtp(@Valid @RequestBody AuthDto.SendOtpRequest req) {
        String otp = authService.sendCounsellorOtp(req.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(otp, "OTP sent successfully"));
    }

    @PostMapping("/counsellor/register/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyCounsellorOtp(@Valid @RequestBody AuthDto.VerifyOtpRequest req) {
        authService.verifyCounsellorOtp(req.getEmail(), req.getOtp());
        return ResponseEntity.ok(ApiResponse.ok(null, "OTP verified"));
    }

    @PostMapping("/counsellor/register/set-password")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> setCounsellorPassword(@Valid @RequestBody AuthDto.SetPasswordRequest req) {
        AuthDto.LoginResponse response = authService.setCounsellorPassword(req.getEmail(), req.getOtp(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Registration complete"));
    }

    @PostMapping("/counsellor/login")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> counsellorLogin(@Valid @RequestBody AuthDto.LoginRequest req) {
        AuthDto.LoginResponse response = authService.loginCounsellor(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }

    @PostMapping("/head-counsellor/login")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> headCounsellorLogin(@Valid @RequestBody AuthDto.LoginRequest req) {
        AuthDto.LoginResponse response = authService.loginHeadCounsellor(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }

    // ── Industry Partner auth ─────────────────────────────────────────────────

    @PostMapping("/industry/register/otp")
    public ResponseEntity<ApiResponse<String>> sendIndustryOtp(@Valid @RequestBody AuthDto.SendOtpRequest req) {
        String otp = authService.sendIndustryOtp(req.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(otp, "OTP sent successfully"));
    }

    @PostMapping("/industry/register/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyIndustryOtp(@Valid @RequestBody AuthDto.VerifyOtpRequest req) {
        authService.verifyIndustryOtp(req.getEmail(), req.getOtp());
        return ResponseEntity.ok(ApiResponse.ok(null, "OTP verified"));
    }

    @PostMapping("/industry/register/set-password")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> setIndustryPassword(@Valid @RequestBody AuthDto.SetPasswordRequest req) {
        AuthDto.LoginResponse response = authService.setIndustryPassword(req.getEmail(), req.getOtp(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Registration complete"));
    }

    @PostMapping("/industry/login")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> industryLogin(@Valid @RequestBody AuthDto.LoginRequest req) {
        AuthDto.LoginResponse response = authService.loginIndustry(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }

    // ── Verifier login ────────────────────────────────────────────────────────

    @PostMapping("/verifier/login")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> verifierLogin(@Valid @RequestBody AuthDto.LoginRequest req) {
        AuthDto.LoginResponse response = authService.loginVerifier(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }

    @PostMapping("/bos/login")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> bosLogin(@Valid @RequestBody AuthDto.LoginRequest req) {
        AuthDto.LoginResponse response = authService.loginBos(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }

    @PostMapping("/sme/login")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> smeLogin(@Valid @RequestBody AuthDto.LoginRequest req) {
        AuthDto.LoginResponse response = authService.loginSme(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }

    /** Universal login endpoint — used by the shared login page for BOS members and other roles */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> universalLogin(@Valid @RequestBody AuthDto.LoginRequest req) {
        AuthDto.LoginResponse response = authService.loginAny(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }

    // ── Forgot Password (all roles) ───────────────────────────────────────────

    @PostMapping("/forgot-password/otp")
    public ResponseEntity<ApiResponse<String>> forgotPasswordOtp(@RequestBody java.util.Map<String, String> body) {
        String otp = authService.sendForgotPasswordOtp(body.get("email"));
        return ResponseEntity.ok(ApiResponse.ok(otp, "OTP sent"));
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<ApiResponse<Void>> forgotPasswordVerify(@RequestBody java.util.Map<String, String> body) {
        authService.verifyForgotPasswordOtp(body.get("email"), body.get("otp"));
        return ResponseEntity.ok(ApiResponse.ok(null, "OTP verified"));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> forgotPasswordReset(@RequestBody java.util.Map<String, String> body) {
        authService.resetPassword(body.get("email"), body.get("otp"), body.get("password"));
        return ResponseEntity.ok(ApiResponse.ok(null, "Password reset successful"));
    }

}
