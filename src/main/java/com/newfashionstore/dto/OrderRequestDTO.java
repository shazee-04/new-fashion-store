package com.newfashionstore.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;

public class OrderRequestDTO implements Serializable {
    @NotNull(message = "please select a payment method")
    private int paymentMethodId;

    private String orderNotes;

    @Valid
    @NotNull(message = "please provide a valid address")
    private AddressDTO address;

    public int getPaymentMethodId() {
        return paymentMethodId;
    }

    public void setPaymentMethodId(int paymentMethodId) {
        this.paymentMethodId = paymentMethodId;
    }

    public String getMerchantId() {
        return orderNotes;
    }

    public void setMerchantId(String merchantId) {
        this.orderNotes = merchantId;
    }

    public AddressDTO getAddress() {
        return address;
    }

    public void setAddress(AddressDTO address) {
        this.address = address;
    }
}
