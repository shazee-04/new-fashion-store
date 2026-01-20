package com.newfashionstore.dto;

import jakarta.validation.constraints.*;

import java.io.Serializable;

public class UserDTO implements Serializable {
    @NotBlank(message = "first name cannot be empty")
    @Size(min = 2, max = 50, message = "first name must be between 2 and 50 characters")
    private String firstName;

    @NotBlank(message = "last name cannot be empty")
    private String lastName;

    @NotBlank(message = "email is required")
    @Email(message = "please provide a valid email address")
    private String email;

    @NotBlank(message = "password is required")
    @Size(min = 8, message = "password must be at least 8 characters long")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$",
            message = "password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number")
    private String password;

    @NotBlank(message = "mobile number is required")
    @Pattern(regexp = "^07[0-9]{8}$", message = "mobile must be a valid 10-digit number")
    private String mobile;

    public UserDTO() {
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
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

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }
}
