package com.newfashionstore.controller;

import com.newfashionstore.annotations.Secure;
import com.newfashionstore.dto.OrderRequestDTO;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.*;
import com.newfashionstore.util.Env;
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

        String publicUrl = Env.get("app.public.url");
        if (publicUrl == null || publicUrl.isBlank()) {
            publicUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort()
                    + request.getContextPath();
        }
        String baseUrl = Env.get("app.url");
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort()
                    + request.getContextPath();
        }
        String returnUrl = baseUrl + "/invoice.html";
        String cancelUrl = baseUrl + "/checkout.html";

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();
            try {
                Map<String, Object> payHereParams = null;
                String payHereHash = null;

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
                String notes = dto.getOrderNotes();
                if (notes != null) {
                    notes = notes.trim();
                    order.setOrderNotes(notes.isEmpty() ? null : notes);
                }

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

                // Update stock quantity
                stock.setQuantity(stock.getQuantity() - cart.getQty());
                session.merge(stock);
            }

            order.setTotalAmount(grandTotal.add(shippingFee));
            session.merge(order);

            if (paymentMethod.getId() == 1) {
                String merchantId = PayHereUtil.getMerchantId();
                if (merchantId == null || merchantId.isBlank()) {
                    transaction.rollback();
                    responseDTO.setSuccess(false);
                    responseDTO.setMessage("PayHere is not configured (missing merchant id).");
                    return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
                }

                session.flush();

                BigDecimal paymentAmount = grandTotal.add(shippingFee);
                String orderId = String.valueOf(order.getId());

                try {
                    payHereHash = PayHereUtil.generateHash(orderId, paymentAmount.doubleValue());
                } catch (Exception e) {
                    transaction.rollback();
                    responseDTO.setSuccess(false);
                    responseDTO.setMessage("PayHere is not configured correctly (hash generation failed).");
                    return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
                }

                String amountFormatted = paymentAmount.setScale(2, RoundingMode.HALF_UP).toPlainString();
                payHereParams = new HashMap<>();
                payHereParams.put("sandbox", true);
                payHereParams.put("merchant_id", merchantId);
                payHereParams.put("return_url", returnUrl + "?orderId=" + orderId);
                payHereParams.put("cancel_url", cancelUrl);
                payHereParams.put("notify_url", publicUrl + "/api/pay/payhere/notify");
                payHereParams.put("order_id", orderId);
                payHereParams.put("items", "Order " + orderId);
                payHereParams.put("amount", amountFormatted);
                payHereParams.put("currency", PayHereUtil.APP_CURRENCY);
                payHereParams.put("first_name", dto.getAddress().getFirstName());
                payHereParams.put("last_name", dto.getAddress().getLastName());
                payHereParams.put("email", dto.getAddress().getEmail());
                payHereParams.put("phone", dto.getAddress().getMobile());

                String addressText = address.getLine1();
                if (address.getLine2() != null && !address.getLine2().isBlank()) {
                    addressText = addressText + ", " + address.getLine2();
                }
                payHereParams.put("address", addressText);
                payHereParams.put("city", address.getCity().getName());
                payHereParams.put("country", PayHereUtil.APP_COUNTRY);
                payHereParams.put("hash", payHereHash);
            }

                transaction.commit();

                Map<String, Object> result = new HashMap<>();
                result.put("orderId", order.getId());
                result.put("redirectUrl", returnUrl);

                if (paymentMethod.getId() == 1) {
                    result.put("payhereHash", payHereHash);
                    result.put("params", payHereParams);
                    result.put("returnUrl", returnUrl);
                    result.put("cancelUrl", cancelUrl);
                }

                responseDTO.setSuccess(true);
                responseDTO.setMessage("Order placed successfully!");
                responseDTO.setData(result);
                return Response.ok().entity(responseDTO).build();
            } catch (Exception e) {
                if (transaction != null && transaction.isActive()) {
                    transaction.rollback();
                }
                throw e;
            }
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
}
