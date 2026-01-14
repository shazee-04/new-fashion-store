package com.newfashionstore.controller;

import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.dto.UserDTO;
import com.newfashionstore.entity.User;
import com.newfashionstore.util.Encryption;
import com.newfashionstore.util.HibernateUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.query.Query;

import java.time.LocalDateTime;

@Path("/login")
public class UserLogin {

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response loginUser(UserDTO loginDTO, @Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            Query<User> query = session.createQuery("FROM User WHERE email = :email", User.class);
            query.setParameter("email", loginDTO.getEmail());
            User user = query.uniqueResult();

            if (user == null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Error: Invalid email or password.");
                return Response.status(Response.Status.UNAUTHORIZED).entity(responseDTO).build();
            }

            if (user.getStatus().getId() != 1) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Error: Your account is inactive. Please contact support.");
                return Response.status(Response.Status.FORBIDDEN).entity(responseDTO).build();
            }

            if (Encryption.checkPassword(loginDTO.getPassword(), user.getPassword())) {
                HttpSession httpSession = request.getSession(true);
                httpSession.setAttribute("user", user);

                session.beginTransaction();

                user.setLastLogin(LocalDateTime.now());

//                session.update(user);
                session.getTransaction().commit();

                responseDTO.setSuccess(true);
                responseDTO.setMessage("Login successful! Hi " + user.getFirstName() + ".");
                return Response.ok().entity(responseDTO).build();
            } else {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Error: Invalid email or password.");
                return Response.status(Response.Status.UNAUTHORIZED).entity(responseDTO).build();
            }
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error: An unexpected error occurred during login.");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}

