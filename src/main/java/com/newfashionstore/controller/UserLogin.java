package com.newfashionstore.controller;

import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.dto.UserDTO;
import com.newfashionstore.entity.Cart;
import com.newfashionstore.entity.Stock;
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
import org.hibernate.Transaction;
import org.hibernate.query.Query;

import java.time.LocalDateTime;
import java.util.HashMap;

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
                HttpSession httpSession = request.getSession();
                HashMap<Integer, Integer> sessionCart = (HashMap<Integer, Integer>) httpSession.getAttribute("sessionCart");

                if (sessionCart != null && !sessionCart.isEmpty()) {
                    try (Session dbSession = HibernateUtil.getSessionFactory().openSession()) {
                        Transaction syncTransaction = dbSession.beginTransaction();

                        for (Integer stockId : sessionCart.keySet()) {
                            Integer qty = sessionCart.get(stockId);

                            Query<Cart> cartQuery = dbSession.createQuery(
                                    "FROM Cart WHERE user.id = :uid AND stock.id = :sid", Cart.class);
                            cartQuery.setParameter("uid", user.getId());
                            cartQuery.setParameter("sid", stockId);
                            Cart existingItem = cartQuery.uniqueResult();

                            if (existingItem != null) {
                                existingItem.setQty(existingItem.getQty() + qty);
                                dbSession.merge(existingItem);
                            } else {
                                Stock stock = dbSession.get(Stock.class, stockId);
                                Cart newCartItem = new Cart();
                                newCartItem.setUser(user);
                                newCartItem.setStock(stock);
                                newCartItem.setQty(qty);
                                dbSession.persist(newCartItem);
                            }
                        }
                        syncTransaction.commit();

                        httpSession.removeAttribute("sessionCart");
                    }
                }

                httpSession.setAttribute("user", user);
                session.beginTransaction();
//                user.setLastLogin(LocalDateTime.now());
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

