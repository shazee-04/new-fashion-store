package com.newfashionstore.controller;

import com.newfashionstore.dto.CartItemDTO;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
            } catch (Exception e) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Adding to cart failed: " + e.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
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

    @GET
    @Path("/count")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCartCount(@Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();

        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");

        long count = 0;

        if (user != null) {
            try (Session dbSession = HibernateUtil.getSessionFactory().openSession()) {
                count = dbSession.createQuery("SELECT COUNT(c) FROM Cart c WHERE c.user.id = :uid", Long.class)
                        .setParameter("uid", user.getId())
                        .uniqueResult();
            } catch (Exception e) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Failed to retrieve cart count: " + e.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
            }
        } else {
            HashMap<Integer, Integer> sessionCart = (HashMap<Integer, Integer>) session.getAttribute("sessionCart");
            if (sessionCart != null) {
                count = sessionCart.size();
            }
        }

        responseDTO.setSuccess(true);
        responseDTO.setMessage("Cart count retrieved successfully");
        responseDTO.setData(count);
        return Response.ok().entity(responseDTO).build();
    }

    @GET
    @Path("/list")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCartList(@Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");

        List<CartItemDTO> cartItems = new ArrayList<>();
        double netTotal = 0.0;

        try (Session dbSession = HibernateUtil.getSessionFactory().openSession()) {
            if (user != null) {
                List<Cart> dbCartItems = dbSession.createQuery("FROM Cart c " +
                                "JOIN FETCH c.stock s " +
                                "JOIN FETCH s.product p " +
                                "JOIN FETCH s.color " +
                                "JOIN FETCH s.size " +
                                "WHERE c.user.id = :uid", Cart.class)
                        .setParameter("uid", user.getId())
                        .list();

                for (Cart c : dbCartItems) {
                    CartItemDTO dto = buildCartItemDTO(dbSession, c.getStock(), c.getQty());
                    cartItems.add(dto);
                    netTotal += dto.getTotalPrice();
                }
            } else {
                HashMap<Integer, Integer> sessionCart = (HashMap<Integer, Integer>) session.getAttribute("sessionCart");

                if (sessionCart != null && !sessionCart.isEmpty()) {
                    List<Stock> stocks = dbSession.createQuery("FROM Stock s " +
                                    "JOIN FETCH s.product p " +
                                    "JOIN FETCH s.color " +
                                    "JOIN FETCH s.size " +
                                    "WHERE s.id IN :ids", Stock.class)
                            .setParameter("ids", sessionCart.keySet())
                            .list();

                    for (Stock s : stocks) {
                        int qty = sessionCart.get(s.getId());
                        CartItemDTO dto = buildCartItemDTO(dbSession, s, qty);
                        cartItems.add(dto);
                        netTotal += dto.getTotalPrice();
                    }
                }
            }

            Map<String, Object> data = new HashMap<>();
            data.put("items", cartItems);
            data.put("netTotal", netTotal);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Cart items retrieved successfully");
            responseDTO.setData(data);
            return Response.ok().entity(responseDTO).build();

        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to retrieve cart items: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    private CartItemDTO buildCartItemDTO(Session dbSession, Stock stock, int qty) {
        CartItemDTO dto = new CartItemDTO();
        dto.setStockId(stock.getId());
        dto.setTitle(stock.getProduct().getTitle());
        dto.setDescription(stock.getProduct().getDescription());
        dto.setColor(stock.getColor().getName());
        dto.setSize(stock.getSize().getName());
        dto.setUnitPrice(stock.getPrice());
        dto.setQty(qty);
        dto.setRemainingStock(stock.getQuantity());
        dto.setTotalPrice(stock.getPrice() * qty);

        String imagePath = dbSession.createQuery("SELECT pi.path FROM ProductImage pi " +
                        "WHERE pi.product.id = :pid ORDER BY pi.id ASC", String.class)
                .setParameter("pid", stock.getProduct().getId())
                .setMaxResults(1)
                .uniqueResult();

        dto.setImagePath(imagePath);
        return dto;
    }
}
