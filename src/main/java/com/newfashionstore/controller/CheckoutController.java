package com.newfashionstore.controller;

import com.newfashionstore.annotations.Secure;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.*;
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
import java.time.format.DateTimeFormatter;
import java.util.List;

@Path("/checkout")
@Secure
public class CheckoutController {

    @POST
    @Path("/payhere")
    @Produces(MediaType.APPLICATION_JSON)
    public Response placeOrder(@QueryParam("addressId") int addressId,
                               @Context HttpServletRequest request) {

        ResponseDTO responseDTO = new ResponseDTO();
        HttpSession httpSession = request.getSession();
        User user = (User) httpSession.getAttribute("user");

        if (user == null) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Please log in to complete your order.");
            return Response.status(Response.Status.UNAUTHORIZED).entity(responseDTO).build();
        }

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            List<Cart> cartItems = session.createQuery("FROM Cart WHERE user.id = :uid", Cart.class)
                    .setParameter("uid", user.getId())
                    .list();

            if (cartItems.isEmpty()) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Your cart is empty.");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }

            String orderId = "NFS-" + user.getId() + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                    + "-" + System.currentTimeMillis() % 10000;

            Orders order = new Orders();
            order.setId(orderId);
            order.setUser(user);
            order.setAddress(session.get(Address.class, addressId));
            order.setOrderStatus(session.get(OrderStatus.class, 1));
            order.setPaymentType("Card");
            order.setTotalAmount(0.0); // Temporary

            session.persist(order); // <--- SAVE THE PARENT FIRST

            double totalAmount = 0;

            for (Cart cartItem : cartItems) {
                Stock stock = cartItem.getStock();

                if (stock.getQuantity() < cartItem.getQty()) {
                    transaction.rollback();
                    return Response.status(Response.Status.BAD_REQUEST).entity(new ResponseDTO(false, "Insufficient stock for: " + stock.getProduct().getTitle())).build();
                }

                stock.setQuantity(stock.getQuantity() - cartItem.getQty());
//                session.merge(stock);

                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);
                orderItem.setStock(stock);
                orderItem.setQty(cartItem.getQty());
                orderItem.setUnitPrice(stock.getPrice());

                totalAmount += (stock.getPrice() * cartItem.getQty());
                session.persist(orderItem);

                session.remove(cartItem);
            }

            order.setTotalAmount(totalAmount);
            session.merge(order);

            transaction.commit();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Order placed successfully! Order ID: " + orderId);
            return Response.ok(responseDTO).build();
        } catch (Exception ex) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ResponseDTO(false, "Checkout failed! Please try again.")).build();
        }
    }

    @GET
    @Path("/payment-methods")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPaymentMethods() {
        ResponseDTO responseDTO = new ResponseDTO();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<PaymentMethod> paymentMethods = session.createQuery(
                    "FROM PaymentMethod", PaymentMethod.class).list();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Payment methods retrieved successfully.");
            responseDTO.setData(paymentMethods);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to retrieve payment methods: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
