package com.newfashionstore.util;

import com.newfashionstore.dto.LoginDTO;
import com.newfashionstore.dto.UserDTO;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;

import java.util.Set;
import java.util.stream.Collectors;

public class Validator {
    private static final ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
    private static final jakarta.validation.Validator validator = factory.getValidator();

    public static String validateUserDTO(UserDTO userDTO) {
        Set<ConstraintViolation<UserDTO>> violations = validator.validate(userDTO);

        if (!violations.isEmpty()) {
            return violations.stream()
                    .map(ConstraintViolation::getMessage)
                    .collect(Collectors.joining(", "));
        }
        return null;
    }

    public static String validateLoginDTO(LoginDTO loginDTO) {
        Set<ConstraintViolation<LoginDTO>> violations = validator.validate(loginDTO);

        if (!violations.isEmpty()) {
            return violations.stream()
                    .map(ConstraintViolation::getMessage)
                    .collect(Collectors.joining(", "));
        }
        return null;
    }

    public static boolean isValidEmail(String email) {
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
        return email != null && email.matches(emailRegex);
    }

    public static boolean isValidPhoneNumber(String phoneNumber) {
        String phoneRegex = "^07[0-9]{8}$";
        return phoneNumber != null && phoneNumber.matches(phoneRegex);
    }
}
