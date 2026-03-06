package com.newfashionstore.controller;

import com.newfashionstore.dto.ContactDTO;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.Status;
import com.newfashionstore.entity.Subscriber;
import com.newfashionstore.mail.ContactEmail;
import com.newfashionstore.mail.NewsletterEmail;
import com.newfashionstore.provider.MailServiceProvider;
import com.newfashionstore.util.HibernateUtil;
import com.newfashionstore.util.Validator;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.Transaction;

@Path("/contact")
public class ContactController {
    private Response.Status status;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response handleContact(ContactDTO contactDTO) {

        ResponseDTO responseDTO = new ResponseDTO();

        if (contactDTO == null ||
                contactDTO.getEmail() == null || contactDTO.getContent() == null ||
                contactDTO.getEmail().isBlank() || contactDTO.getContent().isBlank()) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Please fill required fields!");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        if (!Validator.isValidEmail(contactDTO.getEmail())) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Please provide a valid email address!");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        if (contactDTO.getTele() != null && !contactDTO.getTele().isBlank()) {
            if (!Validator.isValidPhoneNumber(contactDTO.getTele())) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Please provide a valid phone number!");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }
        }

        try {
            ContactEmail contactEmail = new ContactEmail(
                    contactDTO.getName(),
                    contactDTO.getEmail(),
                    contactDTO.getTele(),
                    contactDTO.getSubject(),
                    contactDTO.getContent()
            );
            MailServiceProvider.getInstance().sendMail(contactEmail);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Inquiry sent successfully!");
            return Response.status(Response.Status.OK).entity(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to send inquiry: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("/newsletter/subscribe")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response subscribeNewsletter(Subscriber subscriber) {
        ResponseDTO responseDTO = new ResponseDTO();

        String subject = "Subscribed to New Fashion Store Newsletter";
        String htmlContent = "<p>Thank you for subscribing to our newsletter! " +
                "You'll now receive updates on our latest products, " +
                "exclusive offers, and fashion tips.</p>";

        if (subscriber == null || subscriber.getEmail() == null || subscriber.getEmail().isBlank()) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Please provide a valid email address!");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        if (!Validator.isValidEmail(subscriber.getEmail())) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Please provide a valid email address!");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            Subscriber existingSubscriber = session.createQuery("FROM Subscriber s WHERE s.email = :email", Subscriber.class)
                    .setParameter("email", subscriber.getEmail())
                    .uniqueResult();

            if (existingSubscriber != null) {
                if (existingSubscriber.getStatus().getId() == 1) {
                    transaction.rollback();
                    responseDTO.setSuccess(true);
                    responseDTO.setMessage("Already subscribed to the newsletter!");
                    return Response.status(Response.Status.OK).entity(responseDTO).build();
                } else {
                    existingSubscriber.setStatus(session.get(Status.class, 1));
                    session.merge(existingSubscriber);
                }
            } else {
                Subscriber newSubscriber = new Subscriber();
                newSubscriber.setEmail(subscriber.getEmail());
                newSubscriber.setStatus(session.get(Status.class, 1));
                session.persist(newSubscriber);
            }
            transaction.commit();

            NewsletterEmail newsletterEmail = new NewsletterEmail(
                    subscriber.getEmail(),
                    subject,
                    htmlContent
            );
            MailServiceProvider.getInstance().sendMail(newsletterEmail);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Subscribed to newsletter successfully!");
            return Response.status(Response.Status.OK).entity(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to subscribe to newsletter: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("/newsletter/unsubscribe")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response unsubscribeNewsletter(Subscriber subscriber) {
        ResponseDTO responseDTO = new ResponseDTO();

        if (subscriber == null || subscriber.getEmail() == null || subscriber.getEmail().isBlank()) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Please provide a valid email address!");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        if (!Validator.isValidEmail(subscriber.getEmail())) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Please provide a valid email address!");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            Subscriber existingSubscriber = session.createQuery("FROM Subscriber s WHERE s.email = :email", Subscriber.class)
                    .setParameter("email", subscriber.getEmail())
                    .uniqueResult();

            if (existingSubscriber != null) {
                existingSubscriber.setStatus(session.get(Status.class, 2));
                session.merge(existingSubscriber);
                transaction.commit();

                responseDTO.setSuccess(true);
                responseDTO.setMessage("Unsubscribed from newsletter successfully!");
                return Response.status(Response.Status.OK).entity(responseDTO).build();
            } else {
                transaction.rollback();
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Email not found in subscription list!");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to unsubscribe from newsletter: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
