package com.newfashionstore.util;

import jakarta.ws.rs.core.MultivaluedMap;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

public class PayHereUtil {
    public static final int PAYMENT_SUCCESS = 2;
    public static final int PAYMENT_PENDING = 0;
    public static final int PAYMENT_CANCEL = -1;
    public static final String APP_CURRENCY = defaultIfBlank(Env.get("payhere.currency"), "LKR");
    public static final String APP_COUNTRY = defaultIfBlank(Env.get("payhere.country"), "Sri Lanka");
    private static final String MERCHANT_ID = Env.get("payhere.merchant.id");
    private static final String MERCHANT_SECRET = Env.get("payhere.merchant.secret");

    public static String getMerchantId() {
        return MERCHANT_ID;
    }

    public static String generateHash(String orderId, double amount) {
        if (MERCHANT_ID == null || MERCHANT_ID.trim().isEmpty()) {
            throw new IllegalStateException("Missing payhere.merchant.id");
        }
        if (MERCHANT_SECRET == null || MERCHANT_SECRET.trim().isEmpty()) {
            throw new IllegalStateException("Missing payhere.merchant.secret");
        }

        DecimalFormat df = new DecimalFormat("0.00");
        df.setDecimalFormatSymbols(DecimalFormatSymbols.getInstance(Locale.US));
        String amountFormatted = df.format(amount);

        String secretHash = md5(PayHereUtil.MERCHANT_SECRET).toUpperCase();

        String raw = PayHereUtil.MERCHANT_ID
                + orderId
                + amountFormatted
                + PayHereUtil.APP_CURRENCY
                + secretHash;
        return md5(raw).toUpperCase();
    }

    public static boolean validateNotify(MultivaluedMap<String, String> form) {
        if (form == null) {
            return false;
        }

        String merchantId = form.getFirst("merchant_id");
        String orderId = form.getFirst("order_id");
        String payHereAmount = form.getFirst("payhere_amount");
        String payHereCurrency = form.getFirst("payhere_currency");
        String statusCode = form.getFirst("status_code");
        String md5Sig = form.getFirst("md5sig");

        if (merchantId == null || orderId == null || payHereAmount == null || payHereCurrency == null || statusCode == null || md5Sig == null) {
            return false;
        }

        if (MERCHANT_ID == null || MERCHANT_ID.trim().isEmpty()) {
            return false;
        }

        if (MERCHANT_SECRET == null || MERCHANT_SECRET.trim().isEmpty()) {
            return false;
        }

        if (!MERCHANT_ID.equals(merchantId)) {
            return false;
        }

        String secretHash = md5(PayHereUtil.MERCHANT_SECRET).toUpperCase();
        String localSignature = md5(merchantId + orderId + payHereAmount + payHereCurrency + statusCode + secretHash).toUpperCase();
        return localSignature.equalsIgnoreCase(md5Sig);
    }

    private static String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder(digest.length * 2);

            for (byte b : digest) {
                hex.append(Integer.toHexString((b & 0xFF) | 0x100).substring(1));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 ERROR", e);
        }
    }

    private static String defaultIfBlank(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }
}
