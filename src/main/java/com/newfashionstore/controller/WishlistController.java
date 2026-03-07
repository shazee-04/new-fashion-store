package com.newfashionstore.controller;

import com.newfashionstore.annotations.Secure;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.dto.WishlistItemDTO;
import com.newfashionstore.entity.Product;
import com.newfashionstore.entity.Stock;
import com.newfashionstore.entity.User;
import com.newfashionstore.entity.Wishlist;
import com.newfashionstore.util.HibernateUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Path("/wishlist")
public class WishlistController {

    @POST
    @Path("/add")
    @Secure
    @Produces(MediaType.APPLICATION_JSON)
    public Response addToWishlist(@QueryParam("pId") int productId, @Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();
        HttpSession httpSession = request.getSession();

        User user = (User) httpSession.getAttribute("user");

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            Wishlist existingWishlist = (Wishlist) session
                    .createQuery("FROM Wishlist WHERE user.id = :uid AND product.id = :pid")
                    .setParameter("uid", user.getId())
                    .setParameter("pid", productId)
                    .uniqueResult();
            if (existingWishlist != null) {
                responseDTO.setSuccess(true);
                responseDTO.setMessage("Item is already in wishlist!");
            } else {
                Product product = session.get(Product.class, productId);
                if (product == null) {
                    responseDTO.setSuccess(false);
                    responseDTO.setMessage("Failed adding item to wishlist!");
                    return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
                }
                Wishlist wishlist = new Wishlist();
                wishlist.setUser(user);
                wishlist.setProduct(product);
                wishlist.setAddedDate(LocalDateTime.now());
                session.persist(wishlist);

                transaction.commit();
                responseDTO.setSuccess(true);
                responseDTO.setMessage("Added to wishlist.");
            }
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage(e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @GET
    @Path("/count")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getWishlistCount(@Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();

        HttpSession httpSession = request.getSession();
        User user = (User) httpSession.getAttribute("user");

        long count = 0;

        if (user == null) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to retrieve cart count: login required.");
            return Response.status(Response.Status.UNAUTHORIZED).entity(responseDTO).build();
        }

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            count = session.createQuery("SELECT COUNT(w) FROM Wishlist w WHERE w.user.id = :uid", Long.class)
                    .setParameter("uid", user.getId())
                    .uniqueResult();
            responseDTO.setSuccess(true);
            responseDTO.setMessage("Wishlist count retrieved successfully.");
            responseDTO.setData(count);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to retrieve wishlist count: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @GET
    @Path("/list")
    @Secure
    @Produces(MediaType.APPLICATION_JSON)
    public Response getWishlistList(@Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();
        HttpSession httpSession = request.getSession();

        User user = (User) httpSession.getAttribute("user");

        List<WishlistItemDTO> wishlistItemDTOList = new ArrayList<>();
        double netTotal = 0.0;

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<Wishlist> wishlistItems = session.createQuery("FROM Wishlist w " +
                            "JOIN FETCH w.product " +
                            "WHERE w.user.id = :uid", Wishlist.class)
                    .setParameter("uid", user.getId())
                    .list();

            for (Wishlist w : wishlistItems) {
                WishlistItemDTO dto = new WishlistItemDTO();
                dto.setProductId(w.getProduct().getId());
                dto.setTitle(w.getProduct().getTitle());
                dto.setDescription(w.getProduct().getDescription());

                Stock stock = session.createQuery("FROM Stock s " +
                                "WHERE s.product.id = :pid " +
                                "ORDER BY s.price ASC", Stock.class)
                        .setParameter("pid", w.getProduct().getId())
                        .setMaxResults(1)
                        .uniqueResult();
                dto.setUnitPrice(stock.getPrice());
                dto.setRemainingStock(stock.getQuantity());

                String imagePath = session.createQuery("SELECT pi.path FROM ProductImage pi " +
                                "WHERE pi.product.id = :pid ORDER BY pi.id ASC", String.class)
                        .setParameter("pid", stock.getProduct().getId())
                        .setMaxResults(1)
                        .uniqueResult();
                dto.setImagePath(imagePath);

                wishlistItemDTOList.add(dto);
                netTotal += dto.getUnitPrice();
            }

            Map<String, Object> data = Map.of(
                    "items", wishlistItemDTOList,
                    "netTotal", netTotal
            );

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Wishlist items retrieved successfully.");
            responseDTO.setData(data);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to retrieve wishlist: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
