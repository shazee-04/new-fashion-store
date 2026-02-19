package com.newfashionstore.filter;

import com.newfashionstore.annotations.Secure;
import com.newfashionstore.dto.ResponseDTO;
import jakarta.annotation.Priority;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;

@Provider
@Secure
@Priority(Priorities.AUTHENTICATION)
public class AuthenticationFilter implements ContainerRequestFilter {
    @Context
    private HttpServletRequest request;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        HttpSession session = request.getSession(false);

        boolean isAuthenticated = (session != null && session.getAttribute("user") != null);

        if (!isAuthenticated) {
            ResponseDTO responseDTO = new ResponseDTO();
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Please login first!");

            requestContext.abortWith(
                    Response.status(Response.Status.UNAUTHORIZED)
                            .entity(responseDTO)
                            .build()
            );
        }
    }
}
