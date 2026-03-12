package com.newfashionstore.filter;

import com.newfashionstore.annotations.Secure;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.User;
import jakarta.annotation.Priority;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.hibernate.Session;

import java.io.IOException;

@Provider
@Secure
@Priority(Priorities.AUTHENTICATION)
public class AuthenticationFilter implements ContainerRequestFilter {
    @Context
    private HttpServletRequest request;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        ResponseDTO responseDTO = new ResponseDTO();
        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("user") == null) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Unauthorized access. Please log in.");
            requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED).entity(responseDTO).build());
        } else {
            try (Session dbSession = com.newfashionstore.util.HibernateUtil.getSessionFactory().openSession()) {
                User user = (User) session.getAttribute("user");
                //check user status
                User dbUser = dbSession.get(User.class, user.getId());
                if (dbUser == null || dbUser.getStatus().getId() != 1) {
                    session.invalidate();
                    responseDTO.setSuccess(false);
                    responseDTO.setMessage("Your account is inactive. Please contact support.");
                    requestContext.abortWith(Response.status(Response.Status.FORBIDDEN).entity(responseDTO).build());
                }
            } catch (Exception e) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("An error occurred during authentication. Please try again.");
                requestContext.abortWith(Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build());
            }
        }
    }
}
