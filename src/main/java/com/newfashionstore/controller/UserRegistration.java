package com.newfashionstore.controller;

import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.dto.UserDTO;
import com.newfashionstore.entity.Status;
import com.newfashionstore.entity.User;
import com.newfashionstore.entity.UserType;
import com.newfashionstore.util.Encryption;
import com.newfashionstore.util.HibernateUtil;
import com.newfashionstore.util.Vaidator;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.Query;

@Path("/register")
public class UserRegistration {

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response registerUser(UserDTO userDTO) {
        ResponseDTO responseDTO = new ResponseDTO();

        // Validate DTO ---
        String violations = Vaidator.validateUserDTO(userDTO);
        if (violations != null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ResponseDTO(false, violations))
                    .build();
        }

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            Query<User> checkEmailQuery = session.createQuery("FROM User WHERE email = :email", User.class);
            checkEmailQuery.setParameter("email", userDTO.getEmail());

            if (!checkEmailQuery.list().isEmpty()) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("This email is already registered.");
                return Response.status(Response.Status.CONFLICT).entity(responseDTO).build();
            }

            Status activeStatus = session.get(Status.class, 1);
            UserType customerType = session.get(UserType.class, 2);

            User newUser = new User();
            newUser.setFirstName(userDTO.getFirstName());
            newUser.setLastName(userDTO.getLastName());
            newUser.setEmail(userDTO.getEmail());
            newUser.setMobile(userDTO.getMobile());
            newUser.setStatus(activeStatus);
            newUser.setUserType(customerType);

            String hashedPassword = Encryption.encrypt(userDTO.getPassword());
            newUser.setPassword(hashedPassword);

            session.persist(newUser);
            transaction.commit();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Registration successful.");
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Registration failed: server error " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
