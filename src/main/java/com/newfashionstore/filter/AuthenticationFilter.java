package com.newfashionstore.filter;

import com.newfashionstore.annotation.Secure;
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
import java.net.URI;

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
            requestContext.abortWith(
                    Response.status(Response.Status.UNAUTHORIZED)
                            .location(URI.create(request.getContextPath() + "/login"))
                            .build()
            );
        }
    }
}
