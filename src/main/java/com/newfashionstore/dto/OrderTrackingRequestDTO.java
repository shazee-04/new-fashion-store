package com.newfashionstore.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.io.Serializable;

public class OrderTrackingRequestDTO implements Serializable {
    @NotBlank(message = "order id is required")
    private String orderId;

    @NotBlank(message = "please provide a valid email address")
    @Email(message = "please provide a valid email address")
    private String email;

    public OrderTrackingRequestDTO() {
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}