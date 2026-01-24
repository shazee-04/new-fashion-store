package com.newfashionstore.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.io.Serializable;

public class LoginDTO implements Serializable {

    @NotBlank(message = "please enter a valid email address")
    @Email(message = "please enter a valid email address")
    private String email;

    @NotBlank(message = "please enter your password")
    private String password;

    public LoginDTO() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
