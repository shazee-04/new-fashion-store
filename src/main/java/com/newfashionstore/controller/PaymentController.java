package com.newfashionstore.controller;

import com.newfashionstore.entity.Cart;
import com.newfashionstore.entity.Order;
import com.newfashionstore.entity.OrderStatus;
import com.newfashionstore.entity.Stock;
import com.newfashionstore.util.HibernateUtil;
import com.newfashionstore.util.PayHereUtil;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import org.hibernate.LockMode;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.List;

@Path("/pay")
public class PaymentController {
    @POST
    @Path("/payhere/notify")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public Response payHereNotify(MultivaluedMap<String, String> form) {
        String orderId = form.getFirst("order_id");
        String statusCode = form.getFirst("status_code");

        if (!PayHereUtil.validateNotify(form)) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("INVALID SIGNATURE").build();
        }

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();
            try {
                Order order = session.get(Order.class, Integer.parseInt(orderId));

                if (order == null) {
                    transaction.rollback();
                    return Response.status(Response.Status.NOT_FOUND)
                            .entity("Order not found for Order ID: " + orderId).build();
                }

                int status;
                try {
                    status = Integer.parseInt(statusCode);
                } catch (NumberFormatException e) {
                    transaction.rollback();
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity("Invalid status_code").build();
                }

                if (status == PayHereUtil.PAYMENT_SUCCESS) {
                    order.setOrderStatus(session.get(OrderStatus.class, 2));

                    List<Cart> cartItems = session.createQuery("from Cart c where c.user.id = :uid", Cart.class)
                            .setParameter("uid", order.getUser().getId())
                            .list();

                    // Clear cart
                    for (Cart cart : cartItems) {
                        session.remove(cart);
                    }

                    session.merge(order);

                    // Confirmation email
                    // MailServiceProvider.getInstance().sendMail(new OrderConfirmationEmail(order));
                } else if (status == PayHereUtil.PAYMENT_PENDING) {
                    // Payment is pending; do not fail the order or restore stock.
                    session.merge(order);
                } else {
                    order.setOrderStatus(session.get(OrderStatus.class, 5));

                    // Restore stock for canceled/failed/chargedback payments
                    order.getOrderItems().forEach(orderItem -> {
                        Stock stock = session.get(Stock.class, orderItem.getStock().getId(), LockMode.PESSIMISTIC_WRITE);
                        int updatedQty = stock.getQuantity() + orderItem.getQty();
                        stock.setQuantity(updatedQty);
                        session.merge(stock);
                    });

                    session.merge(order);
                }
                transaction.commit();
            } catch (Exception e) {
                if (transaction != null && transaction.isActive()) {
                    transaction.rollback();
                }
                throw e;
            }
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error processing payment notification: " + e.getMessage()).build();
        }
        return Response.ok().build();
    }
}
