package com.newfashionstore.mail;

import com.newfashionstore.provider.MailServiceProvider;
import com.newfashionstore.util.Env;
import com.newfashionstore.util.Mailable;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.apache.commons.text.StringEscapeUtils;

public class ContactEmail implements Mailable {

    private final String name;
    private final String email;
    private final String tele;
    private final String subject;
    private final String content;

    public ContactEmail(String name, String email, String tele, String subject, String content) {
        this.name = name;
        this.email = email;
        this.tele = tele;
        this.subject = subject;
        this.content = content;
    }

    @Override
    public void run() {
        MailServiceProvider provider = MailServiceProvider.getInstance();
        Session session = Session.getInstance(provider.getProperties(), provider.getAuthenticator());

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(Env.get("app.mail.contact")));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(Env.get("app.mail.contact")));
            message.setReplyTo(new Address[]{new InternetAddress(email)});

            message.setSubject("Contact Form Submission: " + subject);

            String appName = Env.get("app.name");
            String safeName = StringEscapeUtils.escapeHtml4(name);
            String safeEmail = StringEscapeUtils.escapeHtml4(email);
            String safeTel = StringEscapeUtils.escapeHtml4(tele);
            String safeContent = StringEscapeUtils.escapeHtml4(content).replace("\n", "<br>");
            String emailContent =
                    "<!DOCTYPE html>" +
                            "<html>" +
                            "<head>" +
                            "  <meta charset='UTF-8'>" +
                            "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                            "  <title>New Website Inquiry</title>" +
                            "</head>" +

                            "<body style='margin:0; padding:0; background-color:#eef2f7;'>" +

                            "<table width='100%' cellpadding='0' cellspacing='0' style='padding:30px 15px;'>" +
                            "<tr><td align='center'>" +

                            "<table width='100%' style='max-width:650px; background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #e5e7eb;' cellpadding='0' cellspacing='0'>" +

                            // Header
                            "<tr>" +
                            "<td style='background:linear-gradient(90deg,#0d6efd,#0b5ed7); padding:25px; text-align:center; color:white;'>" +
                            "<h2 style='margin:0; font-size:22px;'>New Website Inquiry</h2>" +
                            "</td>" +
                            "</tr>" +

                            // Body
                            "<tr>" +
                            "<td style='padding:30px; color:#333; font-size:14px; line-height:1;'>" +

                            "<table width='100%' cellpadding='0' cellspacing='0'>" +

                            "<tr>" +
                            "<td style='padding:8px 0;'><strong>Name:</strong></td>" +
                            "<td style='padding:8px 0;'>" + safeName + "</td>" +
                            "</tr>" +

                            "<tr>" +
                            "<td style='padding:8px 0;'><strong>Email:</strong></td>" +
                            "<td style='padding:8px 0;'>" + safeEmail + "</td>" +
                            "</tr>" +

                            "<tr>" +
                            "<td style='padding:8px 0;'><strong>Telephone:</strong></td>" +
                            "<td style='padding:8px 0;'>" + safeTel + "</td>" +
                            "</tr>" +

                            "</table>" +

                            "<hr style='margin:25px 0; border:none; border-top:1px solid #e5e7eb;'>" +

                            "<p style='margin-bottom:10px; font-weight:600;'>Message:</p>" +

                            "<div style='background:#f9fafb; padding:18px; border-radius:6px; border-left:4px solid #0d6efd;'>" +
                            safeContent +
                            "</div>" +

                            "<div style='margin-top:30px; text-align:center;'>" +
                            "<a href='mailto:" + safeEmail + "' " +
                            "style='background:#0d6efd; color:white; text-decoration:none; padding:12px 22px; border-radius:5px; display:inline-block; font-size:14px;'>Reply to Sender</a>" +
                            "</div>" +

                            "</td>" +
                            "</tr>" +

                            // Footer
                            "<tr>" +
                            "<td style='background:#f3f4f6; padding:18px; text-align:center; font-size:12px; color:#6b7280;'>" +
                            "This email was sent from <strong>" + appName + "</strong>'s contact form." +
                            "</td>" +
                            "</tr>" +

                            "</table>" +
                            "</td></tr></table>" +

                            "</body>" +
                            "</html>";

            message.setContent(emailContent, "text/html; charset=utf-8");

            Transport.send(message);
            this.onSuccess();
        } catch (MessagingException e) {
            this.onFailure(e);
        }
    }

    @Override
    public void onSuccess() {
        System.out.println("\u001B[32m[EMAIL SENT] Successfully delivered to: " + email + "\u001B[0m");
    }

    @Override
    public void onFailure(Exception e) {
        System.err.println("\u001B[31m[EMAIL FAILED] Could not deliver to " + email + " - " + e.getMessage() + "\u001B[0m");
    }
}
