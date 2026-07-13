package com.hubblehox.e2j.service;

import com.hubblehox.e2j.dto.AuthDto;
import com.hubblehox.e2j.entity.Counsellor;
import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.entity.Student;
import com.hubblehox.e2j.entity.User;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.entity.StudentProfile;
import com.hubblehox.e2j.repository.CounsellorRepository;
import com.hubblehox.e2j.repository.IndustryPartnerRepository;
import com.hubblehox.e2j.repository.InstituteRepository;
import com.hubblehox.e2j.repository.StudentProfileRepository;
import com.hubblehox.e2j.repository.StudentRepository;
import com.hubblehox.e2j.repository.UserRepository;
import com.hubblehox.e2j.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final InstituteRepository instituteRepository;
    private final CounsellorRepository counsellorRepository;
    private final IndustryPartnerRepository industryPartnerRepository;
    private final OtpService otpService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public String sendStudentOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            User existing = userRepository.findByEmail(email).get();
            if (existing.isEnabled()) {
                throw new AppException("Email already registered. Please sign in.", HttpStatus.CONFLICT);
            }
        }
        return otpService.generateAndSendOtp(email);
    }

    public void verifyStudentOtp(String email, String otp) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new AppException("Invalid or expired OTP.", HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional
    public AuthDto.LoginResponse setStudentPassword(String email, String otp, String rawPassword) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new AppException("Invalid or expired OTP.", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmail(email).orElseGet(() ->
                User.builder().email(email).name(email.split("@")[0]).role(User.Role.STUDENT).build()
        );
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEnabled(true);
        userRepository.save(user);

        if (studentRepository.findByUser(user).isEmpty()) {
            studentRepository.save(Student.builder().user(user).build());
        }

        otpService.markUsed(email);
        String token = jwtUtil.generateToken(user);
        return buildLoginResponse(user, token);
    }

    // ── Forgot Password (any role) ────────────────────────────────────────────

    public String sendForgotPasswordOtp(String email) {
        userRepository.findByEmail(email)
                .filter(User::isEnabled)
                .orElseThrow(() -> new AppException("No account found with this email.", HttpStatus.NOT_FOUND));
        return otpService.generateAndSendOtp(email);
    }

    public void verifyForgotPasswordOtp(String email, String otp) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new AppException("Invalid or expired OTP.", HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new AppException("Invalid or expired OTP.", HttpStatus.BAD_REQUEST);
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found.", HttpStatus.NOT_FOUND));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        otpService.markUsed(email);
    }

    @Transactional
    public void changePassword(User currentUser, String currentPassword, String newPassword) {
        if (!passwordEncoder.matches(currentPassword, currentUser.getPassword())) {
            throw new AppException("Current password is incorrect.", HttpStatus.BAD_REQUEST);
        }
        currentUser.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(currentUser);
    }

    public String sendInstituteOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            User existing = userRepository.findByEmail(email).get();
            if (existing.isEnabled()) {
                throw new AppException("Email already registered. Please sign in.", HttpStatus.CONFLICT);
            }
        }
        return otpService.generateAndSendOtp(email);
    }

    public void verifyInstituteOtp(String email, String otp) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new AppException("Invalid or expired OTP.", HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional
    public AuthDto.LoginResponse setInstitutePassword(String email, String otp, String rawPassword) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new AppException("Invalid or expired OTP.", HttpStatus.BAD_REQUEST);
        }
        User user = userRepository.findByEmail(email).orElseGet(() ->
                User.builder().email(email).name(email.split("@")[0]).role(User.Role.INSTITUTE).build()
        );
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEnabled(true);
        User savedUser = userRepository.save(user);
        // create Institute record if one doesn't exist yet for this user
        if (!instituteRepository.existsByUser(savedUser)) {
            instituteRepository.save(Institute.builder()
                    .user(savedUser)
                    .name(email.split("@")[0])
                    .status(Institute.Status.PENDING)
                    .build());
        }
        otpService.markUsed(email);
        String token = jwtUtil.generateToken(user);
        return buildLoginResponse(user, token);
    }

    public AuthDto.LoginResponse loginStudent(String email, String rawPassword) {
        return doLogin(email, rawPassword, User.Role.STUDENT);
    }

    public AuthDto.LoginResponse loginInstitute(String email, String rawPassword) {
        return doLogin(email, rawPassword, User.Role.INSTITUTE);
    }

    // ── Counsellor auth ───────────────────────────────────────────────────────

    public String sendCounsellorOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            User existing = userRepository.findByEmail(email).get();
            if (existing.isEnabled()) {
                throw new AppException("Email already registered. Please sign in.", HttpStatus.CONFLICT);
            }
        }
        return otpService.generateAndSendOtp(email);
    }

    public void verifyCounsellorOtp(String email, String otp) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new AppException("Invalid or expired OTP.", HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional
    public AuthDto.LoginResponse setCounsellorPassword(String email, String otp, String rawPassword) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new AppException("Invalid or expired OTP.", HttpStatus.BAD_REQUEST);
        }
        User user = userRepository.findByEmail(email).orElseGet(() ->
                User.builder().email(email).name(email.split("@")[0]).role(User.Role.COUNSELLOR).build()
        );
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEnabled(true);
        userRepository.save(user);

        if (counsellorRepository.findByUser(user).isEmpty()) {
            counsellorRepository.save(Counsellor.builder().user(user).build());
        }

        otpService.markUsed(email);
        String token = jwtUtil.generateToken(user);
        return buildLoginResponse(user, token);
    }

    public AuthDto.LoginResponse loginCounsellor(String email, String rawPassword) {
        return doLoginAnyOf(email, rawPassword, User.Role.COUNSELLOR, User.Role.HEAD_COUNSELLOR);
    }

    public AuthDto.LoginResponse loginHeadCounsellor(String email, String rawPassword) {
        return doLogin(email, rawPassword, User.Role.HEAD_COUNSELLOR);
    }

    // ── Industry Partner auth ─────────────────────────────────────────────────

    public String sendIndustryOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            User existing = userRepository.findByEmail(email).get();
            if (existing.isEnabled()) {
                throw new AppException("Email already registered. Please sign in.", HttpStatus.CONFLICT);
            }
        }
        return otpService.generateAndSendOtp(email);
    }

    public void verifyIndustryOtp(String email, String otp) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new AppException("Invalid or expired OTP.", HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional
    public AuthDto.LoginResponse setIndustryPassword(String email, String otp, String rawPassword) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new AppException("Invalid or expired OTP.", HttpStatus.BAD_REQUEST);
        }
        User user = userRepository.findByEmail(email).orElseGet(() ->
                User.builder().email(email).name(email.split("@")[0]).role(User.Role.INDUSTRY_PARTNER).build()
        );
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEnabled(true);
        userRepository.save(user);

        if (industryPartnerRepository.findByUser(user).isEmpty()) {
            industryPartnerRepository.save(IndustryPartner.builder().user(user).build());
        }

        otpService.markUsed(email);
        String token = jwtUtil.generateToken(user);
        return buildLoginResponse(user, token);
    }

    public AuthDto.LoginResponse loginIndustry(String email, String rawPassword) {
        return doLogin(email, rawPassword, User.Role.INDUSTRY_PARTNER);
    }

    public AuthDto.LoginResponse loginVerifier(String email, String rawPassword) {
        return doLogin(email, rawPassword, User.Role.VERIFIER);
    }

    public AuthDto.LoginResponse loginBos(String email, String rawPassword) {
        return doLogin(email, rawPassword, User.Role.BOS_MEMBER);
    }

    public AuthDto.LoginResponse loginSme(String email, String rawPassword) {
        return doLogin(email, rawPassword, User.Role.SME);
    }

    /** Universal login — works for any role. Used by the shared login page. */
    public AuthDto.LoginResponse loginAny(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("Invalid email or password.", HttpStatus.UNAUTHORIZED));
        if (!user.isEnabled()) {
            throw new AppException("Account not verified. Complete OTP registration.", HttpStatus.FORBIDDEN);
        }
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new AppException("Invalid email or password.", HttpStatus.UNAUTHORIZED);
        }
        String token = jwtUtil.generateToken(user);
        return buildLoginResponse(user, token);
    }

    private AuthDto.LoginResponse doLoginAnyOf(String email, String rawPassword, User.Role... allowedRoles) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("Invalid email or password.", HttpStatus.UNAUTHORIZED));

        boolean roleMatches = java.util.Arrays.asList(allowedRoles).contains(user.getRole());
        if (!roleMatches) {
            throw new AppException("Invalid email or password.", HttpStatus.UNAUTHORIZED);
        }
        if (!user.isEnabled()) {
            throw new AppException("Account not verified. Complete OTP registration.", HttpStatus.FORBIDDEN);
        }
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new AppException("Invalid email or password.", HttpStatus.UNAUTHORIZED);
        }
        String token = jwtUtil.generateToken(user);
        return buildLoginResponse(user, token);
    }

    private AuthDto.LoginResponse doLogin(String email, String rawPassword, User.Role expectedRole) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("Invalid email or password.", HttpStatus.UNAUTHORIZED));

        if (user.getRole() != expectedRole) {
            throw new AppException("Invalid email or password.", HttpStatus.UNAUTHORIZED);
        }
        if (!user.isEnabled()) {
            throw new AppException("Account not verified. Complete OTP registration.", HttpStatus.FORBIDDEN);
        }
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new AppException("Invalid email or password.", HttpStatus.UNAUTHORIZED);
        }

        String token = jwtUtil.generateToken(user);
        return buildLoginResponse(user, token);
    }

    private AuthDto.LoginResponse buildLoginResponse(User user, String token) {
        String displayName = user.getName();
        if (user.getRole() == User.Role.STUDENT) {
            Student student = studentRepository.findByUser(user).orElse(null);
            if (student != null) {
                StudentProfile profile = studentProfileRepository.findByStudent(student).orElse(null);
                if (profile != null) {
                    String fn = profile.getFirstName() != null ? profile.getFirstName().trim() : "";
                    String ln = profile.getLastName() != null ? profile.getLastName().trim() : "";
                    String full = (fn + " " + ln).trim();
                    if (!full.isEmpty()) displayName = full;
                }
            }
        }
        return AuthDto.LoginResponse.builder()
                .token(token)
                .user(AuthDto.UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .name(displayName)
                        .role(user.getRole().name())
                        .designation(user.getDesignation())
                        .avatar(user.getAvatar())
                        .build())
                .build();
    }
}
