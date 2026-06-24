package com.hubblehox.e2j.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AddressDto {
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String pincode;
    private String state;
    private String country;
}
