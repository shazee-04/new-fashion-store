package com.newfashionstore.controller;

import com.newfashionstore.dto.ContactDTO;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.mail.ContactEmail;
import com.newfashionstore.provider.MailServiceProvider;
import com.newfashionstore.util.Validator;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

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

        if (!Validator.isValidPhoneNumber(contactDTO.getTele())) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Please provide a valid phone number!");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
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
}
