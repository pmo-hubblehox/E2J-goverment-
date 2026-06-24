package com.hubblehox.e2j.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Address {
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String pincode;
    private String state;
    private String country;
}
