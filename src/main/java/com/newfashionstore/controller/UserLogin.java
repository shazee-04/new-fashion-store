package com.newfashionstore.controller;

import com.newfashionstore.dto.LoginDTO;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.dto.UserDTO;
import com.newfashionstore.entity.Cart;
import com.newfashionstore.entity.Stock;
import com.newfashionstore.entity.User;
import com.newfashionstore.util.Encryption;
import com.newfashionstore.util.HibernateUtil;
import com.newfashionstore.util.Vaidator;
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
import org.hibernate.Transaction;
import org.hibernate.query.Query;

import java.util.HashMap;

@Path("/login")
public class UserLogin {

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response loginUser(LoginDTO loginDTO, @Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();

        // Validate DTO ---
        String violations = Vaidator.validateLoginDTO(loginDTO);
        if (violations != null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ResponseDTO(false, violations))
                    .build();
        }

        // Authenticate user ---
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            Query<User> query = session.createQuery("FROM User WHERE email = :email", User.class);
            query.setParameter("email", loginDTO.getEmail());
            User user = query.uniqueResult();

            // Check if user exists ---
            if (user == null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Invalid email or password.");
                return Response.status(Response.Status.UNAUTHORIZED).entity(responseDTO).build();
            }

            // Check if user is active ---
            if (user.getStatus().getId() != 1) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Your account is inactive. Please contact support.");
                return Response.status(Response.Status.FORBIDDEN).entity(responseDTO).build();
            }

            // Verify password ---
            if (Encryption.checkPassword(loginDTO.getPassword(), user.getPassword())) {
                // HTTP session ---
                HttpSession httpSession = request.getSession();
                HashMap<Integer, Integer> sessionCart = (HashMap<Integer, Integer>) httpSession.getAttribute("sessionCart");

                // Sync session cart with database cart
                if (sessionCart != null && !sessionCart.isEmpty()) {
                    try (Session newSession = HibernateUtil.getSessionFactory().openSession()) {
                        Transaction syncTransaction = newSession.beginTransaction();

                        for (Integer stockId : sessionCart.keySet()) {
                            Integer qty = sessionCart.get(stockId);

                            Query<Cart> cartQuery = newSession.createQuery(
                                    "FROM Cart WHERE user.id = :uid AND stock.id = :sid", Cart.class);
                            cartQuery.setParameter("uid", user.getId());
                            cartQuery.setParameter("sid", stockId);
                            Cart existingItem = cartQuery.uniqueResult();

                            if (existingItem != null) {
                                existingItem.setQty(existingItem.getQty() + qty);
                                newSession.merge(existingItem);
                            } else {
                                Stock stock = newSession.get(Stock.class, stockId);
                                Cart newCartItem = new Cart();
                                newCartItem.setUser(user);
                                newCartItem.setStock(stock);
                                newCartItem.setQty(qty);
                                newSession.persist(newCartItem);
                            }
                        }
                        syncTransaction.commit();

                        httpSession.removeAttribute("sessionCart");
                    }
                }

                // Set user in session ---
                httpSession.setAttribute("user", user);

                // Update last login time ---
                session.beginTransaction();
//                user.setLastLogin(LocalDateTime.now());
                session.getTransaction().commit();

                // Prepare data for the response ---
                UserDTO userDTO = new UserDTO();
                userDTO.setFirstName(user.getFirstName());
                userDTO.setLastName(user.getLastName());
                userDTO.setEmail(user.getEmail());
                userDTO.setMobile(user.getMobile());

                responseDTO.setSuccess(true);
                responseDTO.setMessage("Login successful!");
                responseDTO.setData(userDTO);

                return Response.ok().entity(responseDTO).build();
            } else {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Invalid email or password.");
                return Response.status(Response.Status.UNAUTHORIZED).entity(responseDTO).build();
            }
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Login failed: server error");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}

