package com.newfashionstore.controller;

import com.newfashionstore.dto.LoginDTO;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.dto.UserDTO;
import com.newfashionstore.entity.Cart;
import com.newfashionstore.entity.Stock;
import com.newfashionstore.entity.User;
import com.newfashionstore.util.Encryption;
import com.newfashionstore.util.HibernateUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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

import java.time.LocalDateTime;
import java.util.HashMap;

@Path("/login")
public class UserLogin {

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response loginUser(@Valid @NotNull LoginDTO loginDTO, @Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();

        // Redirect if already logged in ---
        HttpSession httpSession = request.getSession(false);
        if (httpSession != null && httpSession.getAttribute("user") != null) {
            responseDTO.setSuccess(true);
            responseDTO.setMessage("Already logged in.");
            return Response.ok(responseDTO).build();
        }

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            // Fetch user ---
            Query<User> query = session.createQuery("FROM User WHERE email = :email", User.class);
            query.setParameter("email", loginDTO.getEmail());
            User user = query.uniqueResult();

            // Credential check ---
            if (user == null || !Encryption.checkPassword(loginDTO.getPassword(), user.getPassword())) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Invalid email or password.");
                return Response.status(Response.Status.UNAUTHORIZED).entity(responseDTO).build();
            }

            // Status check ---
            if (user.getStatus().getId() != 1) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Your account is inactive.");
                return Response.status(Response.Status.FORBIDDEN).entity(responseDTO).build();
            }

            // Start transaction ---
            Transaction transaction = session.beginTransaction();

            // Sync session cart ---
            httpSession = request.getSession();
            HashMap<Integer, Integer> sessionCart = (HashMap<Integer, Integer>) httpSession.getAttribute("sessionCart");

            if (sessionCart != null && !sessionCart.isEmpty()) {
                for (Integer stockId : sessionCart.keySet()) {
                    Integer qty = sessionCart.get(stockId);

                    Cart existingItem = session.createQuery(
                                    "FROM Cart WHERE user.id = :uid AND stock.id = :sid", Cart.class)
                            .setParameter("uid", user.getId())
                            .setParameter("sid", stockId)
                            .uniqueResult();

                    if (existingItem != null) {
                        existingItem.setQty(existingItem.getQty() + qty);
                        session.merge(existingItem);
                    } else {
                        Stock stock = session.get(Stock.class, stockId);
                        Cart newCartItem = new Cart();
                        newCartItem.setUser(user);
                        newCartItem.setStock(stock);
                        newCartItem.setQty(qty);
                        session.persist(newCartItem);
                    }
                }
                httpSession.removeAttribute("sessionCart");
            }

            // Update last login ---
            user.setLastLogin(LocalDateTime.now());
            session.merge(user);

            transaction.commit();

            // User Session ---
            httpSession.setAttribute("user", user);

            // Prepare response ---
            UserDTO userDTO = new UserDTO();
            userDTO.setFirstName(user.getFirstName());
            userDTO.setLastName(user.getLastName());
            userDTO.setEmail(user.getEmail());
            userDTO.setMobile(user.getMobile());

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Login successful!");
            responseDTO.setData(userDTO);

            return Response.ok().entity(responseDTO).build();

        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Login failed: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}

