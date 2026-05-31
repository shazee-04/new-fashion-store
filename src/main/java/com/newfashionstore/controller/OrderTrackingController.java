package com.newfashionstore.controller;

import com.newfashionstore.dto.*;
import com.newfashionstore.entity.Order;
import com.newfashionstore.entity.OrderItem;
import com.newfashionstore.entity.User;
import com.newfashionstore.util.HibernateUtil;
import com.newfashionstore.util.Validator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;

import java.util.*;

@Path("/order-tracking")
public class OrderTrackingController {

    private static Integer parseOrderId(String raw) {
        if (raw == null) return null;
        String value = raw.trim().toUpperCase(Locale.ROOT);
        if (value.startsWith("NF-")) {
            value = value.substring(3);
        }

        value = value.replaceAll("[^0-9]", "");
        if (value.isBlank()) return null;

        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static OrderTrackingDTO buildTrackingDTO(Session session, Order order) {
        OrderTrackingDTO dto = new OrderTrackingDTO();
        dto.setOrderCode("NF-" + String.format("%06d", order.getId()));
        dto.setOrderDate(order.getOrderDate() != null ? order.getOrderDate().toString() : "");
        dto.setStatus(order.getOrderStatus() != null ? order.getOrderStatus().getName() : "");
        dto.setTotalAmount(order.getTotalAmount() == null ? 0 : order.getTotalAmount().doubleValue());
        dto.setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().getName() : "");
        dto.setOrderNotes(order.getOrderNotes());

        OrderTrackingAddressDTO addressDTO = new OrderTrackingAddressDTO();
        addressDTO.setFirstName(order.getAddress().getUser().getFirstName());
        addressDTO.setLastName(order.getAddress().getUser().getLastName());
        addressDTO.setEmail(order.getAddress().getUser().getEmail());
        addressDTO.setMobile(order.getAddress().getUser().getMobile());
        addressDTO.setLineOne(order.getAddress().getLine1());
        addressDTO.setLineTwo(order.getAddress().getLine2());
        addressDTO.setPostalCode(order.getAddress().getPostalCode());
        addressDTO.setCity(order.getAddress().getCity().getName());
        dto.setBillingAddress(addressDTO);

        List<OrderTrackingItemDTO> items = new ArrayList<>();
        Map<Integer, String> imageMap = loadProductImages(session, order.getOrderItems());

        for (OrderItem orderItem : order.getOrderItems()) {
            OrderTrackingItemDTO itemDTO = new OrderTrackingItemDTO();
            itemDTO.setProductId(orderItem.getStock().getProduct().getId());
            itemDTO.setTitle(orderItem.getStock().getProduct().getTitle());
            itemDTO.setColor(orderItem.getStock().getColor().getName());
            itemDTO.setSize(orderItem.getStock().getSize().getName());
            itemDTO.setQty(orderItem.getQty());
            itemDTO.setUnitPrice(orderItem.getUnitPrice());
            itemDTO.setTotalPrice(orderItem.getUnitPrice() * orderItem.getQty());
            itemDTO.setImagePath(imageMap.getOrDefault(orderItem.getStock().getProduct().getId(),
                    "assets/images/product-placeholder.jpg"));
            items.add(itemDTO);
        }

        dto.setItems(items);
        return dto;
    }

    private static Map<Integer, String> loadProductImages(Session session, List<OrderItem> orderItems) {
        Map<Integer, String> imageMap = new HashMap<>();
        if (orderItems == null || orderItems.isEmpty()) {
            return imageMap;
        }

        List<Integer> productIds = orderItems.stream()
                .map(item -> item.getStock().getProduct().getId())
                .distinct()
                .toList();

        List<Object[]> rows = session.createQuery(
                        "SELECT pi.product.id, pi.path FROM ProductImage pi " +
                                "WHERE pi.product.id IN :ids ORDER BY pi.isPrimary DESC, pi.id ASC",
                        Object[].class)
                .setParameter("ids", productIds)
                .list();

        for (Object[] row : rows) {
            Integer productId = (Integer) row[0];
            if (!imageMap.containsKey(productId)) {
                imageMap.put(productId, String.valueOf(row[1]));
            }
        }

        return imageMap;
    }

    @POST
    @Path("/track")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response trackOrder(@Valid @NotNull OrderTrackingRequestDTO requestDTO) {
        ResponseDTO responseDTO = new ResponseDTO();

        String email = requestDTO.getEmail() == null ? "" : requestDTO.getEmail().trim();
        if (!Validator.isValidEmail(email)) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("please provide a valid email address");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        Integer orderId = parseOrderId(requestDTO.getOrderId());
        if (orderId == null) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Invalid order id.");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Order order = session.createQuery(
                            "SELECT DISTINCT o FROM Order o " +
                                    "JOIN FETCH o.user u " +
                                    "JOIN FETCH o.orderStatus s " +
                                    "JOIN FETCH o.paymentMethod pm " +
                                    "JOIN FETCH o.address a " +
                                    "JOIN FETCH a.city c " +
                                    "LEFT JOIN FETCH o.orderItems oi " +
                                    "LEFT JOIN FETCH oi.stock st " +
                                    "LEFT JOIN FETCH st.product p " +
                                    "LEFT JOIN FETCH st.color cl " +
                                    "LEFT JOIN FETCH st.size sz " +
                                    "WHERE o.id = :oid",
                            Order.class)
                    .setParameter("oid", orderId)
                    .uniqueResult();

            if (order == null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Order not found.");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            User user = order.getUser();
            if (user == null || user.getEmail() == null || !user.getEmail().equalsIgnoreCase(email)) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Order not found.");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            OrderTrackingDTO trackingDTO = buildTrackingDTO(session, order);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Order details loaded successfully.");
            responseDTO.setData(trackingDTO);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to load order details: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}