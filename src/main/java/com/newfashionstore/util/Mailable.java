package com.newfashionstore.util;

public interface Mailable extends Runnable {
    default void onSuccess() {
        System.out.println("\u001B[32m[MAIL SUCCESS] Email sent--------------------\u001B[0m");
    }

    default void onFailure(Exception e) {
        System.err.println("\u001B[31m[MAIL FAILED] Error: " + e.getMessage() + "\u001B[0m");
    }
}
