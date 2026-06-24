package com.hubblehox.e2j.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

public class AuthDto {

    @Getter @Setter
    public static class SendOtpRequest {
        @Email @NotBlank
        private String email;
    }

    @Getter @Setter
    public static class VerifyOtpRequest {
        @Email @NotBlank
        private String email;
        @NotBlank @Size(min = 6, max = 6)
        private String otp;
    }

    @Getter @Setter
    public static class SetPasswordRequest {
        @Email @NotBlank
        private String email;
        @NotBlank @Size(min = 6, max = 6)
        private String otp;
        @NotBlank @Size(min = 8)
        private String password;
    }

    @Getter @Setter
    public static class LoginRequest {
        @Email @NotBlank
        private String email;
        @NotBlank
        private String password;
    }

    @Getter @Setter @Builder
    public static class LoginResponse {
        private String token;
        private UserDto user;
    }

    @Getter @Setter @Builder
    public static class UserDto {
        private Long id;
        private String email;
        private String name;
        private String role;
        private String designation;
        private String avatar;
    }
}
