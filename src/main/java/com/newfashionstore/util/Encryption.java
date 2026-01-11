package com.newfashionstore.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class Encryption {

    //    SHA-256 password hashing --------------------
    public static String generateHash(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes());
            StringBuilder sb = new StringBuilder();

            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) sb.append('0');
                sb.append(hex);
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Encyption error: " + e.getMessage());
        }
    }

    //    BCrypt password hashing --------------------
    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Hashes a password using BCrypt.
     * The salt is automatically generated and included in the returned string.
     */
    public static String encrypt(String plainPassword) {
        return passwordEncoder.encode(plainPassword);
    }

    /**
     * Checks if a plain text password matches a stored BCrypt hash.
     * Use this during the Login process.
     */
    public static boolean checkPassword(String plainPassword, String hashedPassword) {
        return passwordEncoder.matches(plainPassword, hashedPassword);
    }

}
