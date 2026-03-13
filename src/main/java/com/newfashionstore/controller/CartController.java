package com.newfashionstore.controller;

import com.newfashionstore.annotations.Secure;
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

                for (Cart cartItem : dbCartItems) {
                    CartItemDTO dto = buildCartItemDTO(
                            dbSession,
                            cartItem.getStock(),
                            cartItem.getQty()
                    );
                    cartItems.add(dto);
                    netTotal += dto.getTotalPrice();
                }
            } else {
                HashMap<Integer, Integer> sessionCart = (HashMap<Integer, Integer>) session.getAttribute("sessionCart");

                if (sessionCart != null && !sessionCart.isEmpty()) {
                    List<Stock> stockList = dbSession.createQuery("FROM Stock s " +
                                    "JOIN FETCH s.product p " +
                                    "JOIN FETCH s.color " +
                                    "JOIN FETCH s.size " +
                                    "WHERE s.id IN :ids AND p.status.id = 1", Stock.class)
                            .setParameter("ids", sessionCart.keySet())
                            .list();

                    for (Stock stock : stockList) {
                        CartItemDTO dto = buildCartItemDTO(
                                dbSession,
                                stock,
                                sessionCart.get(stock.getId())
                        );
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
        dto.setProductId(stock.getProduct().getId());
        dto.setStockId(stock.getId());
        dto.setTitle(stock.getProduct().getTitle());
        dto.setDescription(stock.getProduct().getDescription());
        dto.setColor(stock.getColor().getName());
        dto.setSize(stock.getSize().getName());
        dto.setUnitPrice(stock.getPrice());
        dto.setQty(qty);
        dto.setRemainingStock(stock.getQuantity());
        dto.setTotalPrice(stock.getPrice() * qty);
        dto.setAvailable(stock.getProduct().getStatus().getId() == 1);

        String imagePath = dbSession.createQuery("SELECT pi.path FROM ProductImage pi " +
                        "WHERE pi.product.id = :pid ORDER BY pi.id ASC", String.class)
                .setParameter("pid", stock.getProduct().getId())
                .setMaxResults(1)
                .uniqueResult();

        dto.setImagePath(imagePath);
        return dto;
    }

    @GET
    @Path("/validate")
    @Secure
    @Produces(MediaType.APPLICATION_JSON)
    public Response validateCart(@Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();
        HttpSession session = request.getSession();

        User user = (User) session.getAttribute("user");
        List<String> issues = new ArrayList<>();
        List<Integer> outOfStockItems = new ArrayList<>();
        List<Integer> unavailableItems = new ArrayList<>();

        try (Session dbSession = HibernateUtil.getSessionFactory().openSession()) {
            List<Cart> cartItems = dbSession.createQuery("FROM Cart c " +
                            "JOIN FETCH c.stock s " +
                            "JOIN FETCH s.product p " +
                            "JOIN FETCH p.status " +
                            "WHERE c.user.id = :uid", Cart.class)
                    .setParameter("uid", user.getId())
                    .list();

            if (cartItems == null || cartItems.isEmpty()) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Your cart is empty.");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }

            for (Cart cartItem : cartItems) {
                Stock stock = cartItem.getStock();
                if (stock.getProduct().getStatus().getId() != 1) {
                    issues.add("Product " + stock.getProduct().getTitle() + " is not available.");
                    unavailableItems.add(stock.getId());
                } else if (stock.getQuantity() < cartItem.getQty()) {
                    issues.add("Insufficient stock for " + stock.getProduct().getTitle() + ".");
                    outOfStockItems.add(stock.getId());
                }
            }

            if (issues.isEmpty()) {
                responseDTO.setSuccess(true);
                responseDTO.setMessage("Cart is valid and ready for checkout.");
            } else {
                Map<String, Object> data = new HashMap<>();
                data.put("issues", issues);
                data.put("noStock", outOfStockItems);
                data.put("unavailable", unavailableItems);

                responseDTO.setSuccess(false);
                responseDTO.setMessage("Some items are not available! Please review your cart.");
                responseDTO.setData(data);
            }
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to validate cart: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

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

        try (Session dbSession = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = dbSession.beginTransaction();

            Stock stock = dbSession.get(Stock.class, stockId);

            if (stock == null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Product variant not found!");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            if (qty <= 0) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Quantity must be greater than zero!");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }

            if (stock.getProduct().getStatus().getId() != 1) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Product is not available!");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }

            if (stock.getQuantity() < qty) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Insufficient available stock!");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }

            if (user != null) {
                Cart cartItem = dbSession.createQuery("FROM Cart " +
                                "WHERE user.id = :uid AND stock.id = :sid", Cart.class)
                        .setParameter("uid", user.getId())
                        .setParameter("sid", stockId)
                        .uniqueResult();

                if (cartItem == null) {
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    newCart.setStock(stock);
                    newCart.setQty(qty);
                    dbSession.persist(newCart);

                    transaction.commit();
                    responseDTO.setSuccess(true);
                    responseDTO.setMessage("Item added to cart successfully");
                    return Response.status(Response.Status.OK).entity(responseDTO).build();
                }

                int newQty = cartItem.getQty() + qty;
                int maxQty = stock.getQuantity();
                if (newQty > maxQty) {
                    responseDTO.setSuccess(false);
                    responseDTO.setMessage("Insufficient available stock!");
                    return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
                }
                cartItem.setQty(newQty);
                dbSession.merge(cartItem);
                transaction.commit();

                responseDTO.setSuccess(true);
                responseDTO.setMessage("Item added to cart successfully");
                return Response.status(Response.Status.OK).entity(responseDTO).build();
            } else {
                HashMap<Integer, Integer> sessionCart = (HashMap<Integer, Integer>) session.getAttribute("sessionCart");
                if (sessionCart == null) {
                    sessionCart = new HashMap<>();
                }

                sessionCart.put(stockId, sessionCart.getOrDefault(stockId, 0) + qty);
                session.setAttribute("sessionCart", sessionCart);

                responseDTO.setSuccess(true);
                responseDTO.setMessage("Item added. Log in to save cart!");
                return Response.ok().entity(responseDTO).build();
            }
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Adding to cart failed: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @DELETE
    @Path("/remove")
    @Produces(MediaType.APPLICATION_JSON)
    public Response removeFromCart(@QueryParam("stockId") int stockId,
                                   @QueryParam("qty") @DefaultValue("0") int qty,
                                   @Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();
        HttpSession session = request.getSession();

        User user = (User) session.getAttribute("user");

        if (stockId <= 0) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Invalid stock ID!");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        try (Session dbSession = HibernateUtil.getSessionFactory().openSession()) {
            if (user != null) {
                Transaction transaction = dbSession.beginTransaction();
                Cart cartItem = dbSession.createQuery(
                                "FROM Cart WHERE user.id = :uid AND stock.id = :sid", Cart.class)
                        .setParameter("uid", user.getId())
                        .setParameter("sid", stockId)
                        .uniqueResult();

                if (cartItem == null) {
                    responseDTO.setSuccess(false);
                    responseDTO.setMessage("Cart item not found!");
                    return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
                }

                if (qty <= 0) {
                    dbSession.remove(cartItem);
                    transaction.commit();
                    responseDTO.setSuccess(true);
                    responseDTO.setMessage("Item removed from cart successfully");
                    return Response.ok(responseDTO).build();
                }

                if (cartItem.getQty() > qty) {
                    cartItem.setQty(cartItem.getQty() - qty);
                    dbSession.merge(cartItem);
                } else {
                    dbSession.remove(cartItem);
                }
                transaction.commit();
            } else {
                Map<Integer, Integer> sessionCart =
                        (Map<Integer, Integer>) session.getAttribute("sessionCart");
                if (sessionCart == null || !sessionCart.containsKey(stockId)) {
                    responseDTO.setSuccess(false);
                    responseDTO.setMessage("Cart item not found in session!");
                    return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
                }

                if (qty > 0) {
                    int currentQty = sessionCart.get(stockId);
                    if (currentQty > qty) {
                        sessionCart.put(stockId, currentQty - qty);
                    } else {
                        sessionCart.remove(stockId);
                    }
                } else {
                    sessionCart.remove(stockId);
                }
                session.setAttribute("sessionCart", sessionCart);
            }
            responseDTO.setSuccess(true);
            responseDTO.setMessage("Item removed from cart successfully");
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to remove item from cart: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
