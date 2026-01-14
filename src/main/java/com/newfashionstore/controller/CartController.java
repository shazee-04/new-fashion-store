package com.newfashionstore.controller;

import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.Cart;
import com.newfashionstore.entity.Stock;
import com.newfashionstore.entity.User;
import com.newfashionstore.util.HibernateUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.HashMap;

@Path("/cart")
public class CartController {

    @POST
    @Path("/add")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addToCart(@QueryParam("stockId") int stockId,
                              @QueryParam("qty") int qty,
                              @Context HttpServletRequest request) {

        ResponseDTO responseDTO = new ResponseDTO();
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");

        if (user != null) {
            try (Session dbSession = HibernateUtil.getSessionFactory().openSession()) {
                Transaction t = dbSession.beginTransaction();

                Stock stock = dbSession.get(Stock.class, stockId);

                Cart cartItem = (Cart) dbSession.createQuery("FROM Cart WHERE user.id = :uid AND stock.id = :sid")
                        .setParameter("uid", user.getId())
                        .setParameter("sid", stockId)
                        .uniqueResult();

                if (cartItem != null) {
                    cartItem.setQty(cartItem.getQty() + qty);
//                    dbSession.update(cartItem);
                } else {
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    newCart.setStock(stock);
                    newCart.setQty(qty);
                    dbSession.persist(newCart);
                }

                t.commit();
                responseDTO.setSuccess(true);
                responseDTO.setMessage("Item added to cart successfully");
            }
        } else {
            HashMap<Integer, Integer> sessionCart = (HashMap<Integer, Integer>) session.getAttribute("sessionCart");
            if (sessionCart == null) {
                sessionCart = new HashMap<>();
            }

            sessionCart.put(stockId, sessionCart.getOrDefault(stockId, 0) + qty);
            session.setAttribute("sessionCart", sessionCart);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Item added. Log in to save cart!");
        }
        return Response.ok().entity(responseDTO).build();
    }
}
