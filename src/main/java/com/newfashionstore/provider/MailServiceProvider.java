package com.newfashionstore.provider;

import com.newfashionstore.util.Env;
import jakarta.mail.Authenticator;
import jakarta.mail.PasswordAuthentication;

import java.util.Properties;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class MailServiceProvider {
    private final Properties properties = new Properties();
    private ThreadPoolExecutor executor;
    private Authenticator authenticator;

    private MailServiceProvider() {
        properties.put("mail.smtp.auth", true);
        properties.put("mail.smtp.starttls.enable", true);
        properties.put("mail.smtp.host", Env.get("mail.host"));
        properties.put("mail.smtp.port", Env.get("mail.port"));
        properties.put("mail.smtp.ssl.trust", Env.get("mail.host"));
    }

    public static MailServiceProvider getInstance() {
        return Holder.INSTANCE;
    }

    public void start() {
        authenticator = new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(Env.get("mail.username"), Env.get("mail.password"));
            }
        };
        // Using a standard queue; let the executor handle the "offer" logic
        executor = new ThreadPoolExecutor(2, 5, 5,
                TimeUnit.SECONDS, new LinkedBlockingQueue<>(), new ThreadPoolExecutor.AbortPolicy());

        System.out.println("\u001B[32mMailServiceProvider Initialized-------------\u001B[0m");
    }

    public void sendMail(Runnable mailable) {
        if (executor != null && !executor.isShutdown()) {
            executor.execute(mailable); // This is safer than manual queue offering
        }
    }

    public void shutdown() {
        if (executor != null) {
            executor.shutdown();
            System.out.println("\u001B[31mMailServiceProvider Shutdown-------------\u001B[0m");
        }
    }

    public ThreadPoolExecutor getExecutor() {
        return executor;
    }

    public void setExecutor(ThreadPoolExecutor executor) {
        this.executor = executor;
    }

    public Properties getProperties() {
        return properties;
    }

    public Authenticator getAuthenticator() {
        return authenticator;
    }

    public void setAuthenticator(Authenticator authenticator) {
        this.authenticator = authenticator;
    }

    // Thread-safe Singleton
    private static class Holder {
        private static final MailServiceProvider INSTANCE = new MailServiceProvider();
    }
}