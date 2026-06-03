package com.newfashionstore.mail;

import com.newfashionstore.provider.MailServiceProvider;
import com.newfashionstore.util.Env;
import com.newfashionstore.util.Mailable;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

public class NewsletterEmail implements Mailable {

    private final String toEmail;
    private final String subject;
    private final String htmlContent;

    private final String unsubscribeLink = Env.get("app.url") + "/unsubscribe.html?";
    private final String token;

    public NewsletterEmail(String toEmail, String subject, String htmlContent, String token) {
        this.toEmail = toEmail;
        this.subject = subject;
        this.htmlContent = htmlContent;
        this.token = token;
    }

    @Override
    public void run() {
        MailServiceProvider provider = MailServiceProvider.getInstance();
        Session session = Session.getInstance(provider.getProperties(), provider.getAuthenticator());

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(Env.get("mail.username"), "New Fashion Store"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));

            message.setSubject(subject);

            String emailContent =
                    "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6f800; padding:0 0; font-family:Arial, sans-serif;'>" +
                            "<tr>" +
                            "<td align='center'>" +

                            "<table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e7eb;'>" +

                            // HEADER
                            "<tr>" +
                            "<td style='background:#000000; color:#ffffff; text-align:center; padding:25px;'>" +
                            "<h2 style='margin:0; letter-spacing:1px;'>NEW FASHION STORE</h2>" +
                            "</td>" +
                            "</tr>" +

                            // CONTENT
                            "<tr>" +
                            "<td style='padding:30px; font-size:14px; color:#333333; line-height:1.6;'>" +
                            htmlContent +
                            "</td>" +
                            "</tr>" +

                            // FOOTER
                            "<tr>" +
                            "<td style='background:#f9f9f9; padding:20px; text-align:center; font-size:12px; color:#777;'>" +
                            "<p style='margin:5px 0;'>You are receiving this email because you subscribed to our newsletter.</p>" +
                            "<p style='margin:5px 0;'>© " + java.time.Year.now() + " NEW FASHION STORE</p>" +
                            "<p style='margin:5px 0;'>" +
                            "<a href='" + unsubscribeLink + token + "' " +
                            "style='color:#777; text-decoration:underline;'>Unsubscribe</a>" +
                            "</p>" +
                            "</td>" +
                            "</tr>" +

                            "</table>" +

                            "</td>" +
                            "</tr>" +
                            "</table>";

            message.setContent(emailContent, "text/html");

            Transport.send(message);
            this.onSuccess();

        } catch (Exception e) {
            this.onFailure(e);
        }
    }

    @Override
    public void onSuccess() {
        System.out.println("\u001B[32m[NEWSLETTER SENT] Successfully delivered to: " + toEmail + "\u001B[0m");
    }

    @Override
    public void onFailure(Exception e) {
        System.err.println("\u001B[31m[NEWSLETTER FAILED] Could not deliver to " + toEmail + " - " + e.getMessage() + "\u001B[0m");
    }
}