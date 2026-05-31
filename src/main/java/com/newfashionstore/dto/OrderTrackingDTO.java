package com.newfashionstore.dto;

import java.io.Serializable;
import java.util.List;

public class OrderTrackingDTO implements Serializable {
    private String orderCode;
    private String orderDate;
    private String status;
    private double totalAmount;
    private String paymentMethod;
    private String orderNotes;
    private OrderTrackingAddressDTO billingAddress;
    private List<OrderTrackingItemDTO> items;

    public OrderTrackingDTO() {
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public String getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(String orderDate) {
        this.orderDate = orderDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getOrderNotes() {
        return orderNotes;
    }

    public void setOrderNotes(String orderNotes) {
        this.orderNotes = orderNotes;
    }

    public OrderTrackingAddressDTO getBillingAddress() {
        return billingAddress;
    }

    public void setBillingAddress(OrderTrackingAddressDTO billingAddress) {
        this.billingAddress = billingAddress;
    }

    public List<OrderTrackingItemDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderTrackingItemDTO> items) {
        this.items = items;
    }
}