package com.newfashionstore.entity;

import jakarta.persistence.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriber")
public class Subscriber implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "date_subscribed", nullable = false)
    private LocalDateTime dateSubscribed;

    @Column(name = "token", nullable = false, length = 255)
    private String token;

    @ManyToOne
    @JoinColumn(name = "status_id", nullable = false)
    private Status status;

    public Subscriber() {
        this.dateSubscribed = LocalDateTime.now();
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getDateSubscribed() {
        return dateSubscribed;
    }

    public void setDateSubscribed(LocalDateTime dateSubscribed) {
        this.dateSubscribed = dateSubscribed;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
