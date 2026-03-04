package com.newfashionstore.mail;

import com.newfashionstore.provider.MailServiceProvider;
import com.newfashionstore.util.Env;
import com.newfashionstore.util.Mailable;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

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
            String emailContent =
                    "<html>" +
                            "<head>" +
                            "  <meta charset='UTF-8'>" +
                            "  <title>New Website Inquiry</title>" +
                            "</head>" +
                            "<body style='margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;'>" +
                            "  <table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f4f6f8; padding:20px 0;'>" +
                            "    <tr>" +
                            "      <td align='center'>" +
                            "        <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.05); overflow:hidden;'>" +
                            "          <tr>" +
                            "            <td style='background:#0d6efd; padding:20px; text-align:center; color:#ffffff;'>" +
                            "              <h2 style='margin:0; font-size:22px;'>New Website Inquiry</h2>" +
                            "            </td>" +
                            "          </tr>" +
                            "          <tr>" +
                            "            <td style='padding:25px; color:#333333; font-size:14px; line-height:1.6;'>" +
                            "              <p style='margin:0 0 10px;'><strong>Name:</strong> " + name + "</p>" +
                            "              <p style='margin:0 0 10px;'><strong>Email:</strong> " + email + "</p>" +
                            "              <p style='margin:0 0 10px;'><strong>Tel:</strong> " + tele + "</p>" +
                            "              <p style='margin:20px 0 8px; font-weight:bold;'>Message:</p>" +
                            "              <div style='background:#f8f9fa; padding:15px; border-left:4px solid #0d6efd; border-radius:4px;'>" +
                            "                " + content.replace("\n", "<br>") +
                            "              </div>" +
                            "            </td>" +
                            "          </tr>" +
                            "          <tr>" +
                            "            <td style='background:#f1f1f1; padding:15px; text-align:center; font-size:12px; color:#777;'>" +
                            "              This email was sent from " + appName + "'s contact form." +
                            "            </td>" +
                            "          </tr>" +
                            "        </table>" +
                            "      </td>" +
                            "    </tr>" +
                            "  </table>" +
                            "</body>" +
                            "</html>";

            message.setContent(emailContent, "text/html; charset=utf-8");

            Transport.send(message);
            this.onSuccess();
        } catch (MessagingException e) {
            this.onFailure(e);
        }
    }
}
