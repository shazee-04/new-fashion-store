package com.newfashionstore.filter;

import com.newfashionstore.annotations.AdminOnly;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;

@Provider
@AdminOnly
public class AdminAuthFilter implements ContainerRequestFilter {
    @Context
    private HttpServletRequest request;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        HttpSession session = request.getSession();

        if (session == null || session.getAttribute("user") == null) {
            abortWithStatus(requestContext, Response.Status.UNAUTHORIZED, "Access Denied: Please log in first.");
            return;
        }

        User user = (User) session.getAttribute("user");

        if (user.getUserType().getId() != 1) {
            abortWithStatus(requestContext, Response.Status.FORBIDDEN, "Access Denied: Admins only.");
        }
    }

    private void abortWithStatus(ContainerRequestContext requestContext, Response.Status status, String message) {
        ResponseDTO responseDTO = new ResponseDTO();
        responseDTO.setSuccess(false);
        responseDTO.setMessage(message);

        requestContext.abortWith(Response.status(status).entity(responseDTO).type(MediaType.APPLICATION_JSON).build());
    }
}
