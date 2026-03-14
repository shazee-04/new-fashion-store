package com.newfashionstore.controller;

import com.newfashionstore.annotations.Secure;
import com.newfashionstore.dto.OrderRequestDTO;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.*;
import com.newfashionstore.util.HibernateUtil;
import com.newfashionstore.util.PayHereUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.LockMode;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/checkout")
@Secure
public class CheckoutController {

    @POST
    @Path("/place-order")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response placeOrder(@Context HttpServletRequest request,
                               @Valid OrderRequestDTO dto) {

        ResponseDTO responseDTO = new ResponseDTO();
        User user = (User) request.getSession().getAttribute("user");

        BigDecimal shippingFee = new BigDecimal("350");
        BigDecimal grandTotal = BigDecimal.ZERO;

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            List<Cart> cartItems = session.createQuery(
                            "FROM Cart c " +
                                    "JOIN FETCH c.stock s " +
                                    "JOIN FETCH s.product p " +
                                    "WHERE c.user.id = :uid", Cart.class)
                    .setParameter("uid", user.getId())
                    .list();

            if (cartItems.isEmpty()) {
                transaction.rollback();
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Cart is empty.");
                return Response.status(400).entity(responseDTO).build();
            }

            Address address = session.createQuery(
                            "FROM Address a WHERE a.id = :aid AND a.user.id = :uid",
                            Address.class)
                    .setParameter("aid", dto.getAddress().getId())
                    .setParameter("uid", user.getId())
                    .uniqueResult();

            if (address == null) {
                transaction.rollback();
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Invalid address.");
                return Response.status(400).entity(responseDTO).build();
            }

            PaymentMethod paymentMethod =
                    session.get(PaymentMethod.class, dto.getPaymentMethodId());

            if (paymentMethod == null) {
                transaction.rollback();
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Invalid payment method.");
                return Response.status(400).entity(responseDTO).build();
            }

            Order order = new Order();
            order.setUser(user);
            order.setOrderDate(LocalDateTime.now());
            order.setPaymentMethod(paymentMethod);
            order.setAddress(address);

            int statusId = paymentMethod.getId() == 3 ? 2 : 1;
            order.setOrderStatus(session.get(OrderStatus.class, statusId));

            session.persist(order);

            for (Cart cart : cartItems) {
                Stock stock = session.get(
                        Stock.class,
                        cart.getStock().getId(),
                        LockMode.PESSIMISTIC_WRITE
                );

                if (stock.getQuantity() < cart.getQty()) {
                    transaction.rollback();
                    responseDTO.setSuccess(false);
                    responseDTO.setMessage(
                            "Insufficient stock for product: "
                                    + stock.getProduct().getTitle());
                    return Response.status(400).entity(responseDTO).build();
                }

                if (stock.getProduct().getStatus().getId() != 1) {
                    transaction.rollback();
                    responseDTO.setSuccess(false);
                    responseDTO.setMessage(
                            "Product unavailable: "
                                    + stock.getProduct().getTitle());
                    return Response.status(400).entity(responseDTO).build();
                }

                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setStock(stock);
                item.setQty(cart.getQty());
                item.setUnitPrice(stock.getPrice());

                session.persist(item);

                BigDecimal itemTotal = BigDecimal.valueOf(stock.getPrice())
                        .multiply(BigDecimal.valueOf(cart.getQty()));

                grandTotal = grandTotal.add(itemTotal);

                stock.setQuantity(stock.getQuantity() - cart.getQty());
                session.merge(stock);

                session.remove(cart);
            }

            order.setTotalAmount(grandTotal.add(shippingFee));
            session.merge(order);

            transaction.commit();

            Map<String, Object> result = new HashMap<>();
            result.put("orderId", order.getId());

            if (paymentMethod.getId() == 1) {
                BigDecimal paymentAmount = grandTotal.add(shippingFee);
                String orderId = String.valueOf(order.getId());
                String hash = PayHereUtil.generateHash(orderId, paymentAmount.doubleValue());

                result.put("payhereHash", hash);

                String baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort()
                        + request.getContextPath();

                Map<String, Object> params = new HashMap<>();
                String amountFormatted = paymentAmount.setScale(2, RoundingMode.HALF_UP).toPlainString();
                params.put("sandbox", true);
                params.put("merchant_id", PayHereUtil.getMerchantId());
                params.put("return_url", baseUrl + "/order-tracking.html");
                params.put("cancel_url", baseUrl + "/checkout.html");
                params.put("notify_url", baseUrl + "/api/checkout/payhere/notify");
                params.put("order_id", orderId);
                params.put("items", "Order " + orderId);
                params.put("amount", amountFormatted);
                params.put("currency", PayHereUtil.APP_CURRENCY);
                params.put("first_name", user.getFirstName());
                params.put("last_name", user.getLastName());
                params.put("email", user.getEmail());
                params.put("phone", user.getMobile());
                params.put("address", address.getLine1());
                params.put("city", address.getCity().getName());
                params.put("country", PayHereUtil.APP_COUNTRY);
                params.put("hash", hash);

                result.put("params", params);
            }

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Order placed successfully!");
            responseDTO.setData(result);
            return Response.ok().entity(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to place order: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
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

    @POST
    @Path("/payhere/notify")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public Response payHereNotify(@Context HttpServletRequest request) {
        return Response.ok().build();
    }
}
