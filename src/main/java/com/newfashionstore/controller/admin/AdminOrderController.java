package com.newfashionstore.controller.admin;

import com.newfashionstore.annotations.AdminOnly;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.Order;
import com.newfashionstore.entity.OrderItem;
import com.newfashionstore.entity.OrderStatus;
import com.newfashionstore.util.HibernateUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/admin/orders")
@AdminOnly
public class AdminOrderController {

    @GET
    @Path("/list")
    @Produces(MediaType.APPLICATION_JSON)
    public Response listOrders() {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<Order> orders = session.createQuery(
                            "SELECT DISTINCT o FROM Order o " +
                                    "JOIN FETCH o.user " +
                                    "JOIN FETCH o.orderStatus " +
                                    "JOIN FETCH o.paymentMethod " +
                                    "ORDER BY o.orderDate DESC", Order.class)
                    .list();

            List<Map<String, Object>> orderList = new ArrayList<>();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            for (Order o : orders) {
                Map<String, Object> oMap = new HashMap<>();
                oMap.put("id", o.getId());
                oMap.put("orderCode", "NF-" + String.format("%06d", o.getId()));
                oMap.put("customerName", o.getUser().getFirstName() + " " + o.getUser().getLastName());
                oMap.put("email", o.getUser().getEmail());
                oMap.put("totalAmount", o.getTotalAmount());
                oMap.put("statusId", o.getOrderStatus().getId());
                oMap.put("statusName", o.getOrderStatus().getName());
                oMap.put("paymentMethod", o.getPaymentMethod().getName());
                oMap.put("orderDate", o.getOrderDate() != null ? o.getOrderDate().format(formatter) : "");
                orderList.add(oMap);
            }

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Orders retrieved successfully");
            responseDTO.setData(orderList);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error loading orders: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @GET
    @Path("/detail")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getOrderDetail(@QueryParam("id") int id) {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Order o = session.createQuery(
                            "SELECT o FROM Order o " +
                                    "JOIN FETCH o.user " +
                                    "JOIN FETCH o.orderStatus " +
                                    "JOIN FETCH o.paymentMethod " +
                                    "JOIN FETCH o.address a " +
                                    "JOIN FETCH a.city " +
                                    "WHERE o.id = :id", Order.class)
                    .setParameter("id", id)
                    .uniqueResult();

            if (o == null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Order not found");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            List<OrderItem> items = session.createQuery(
                            "SELECT oi FROM OrderItem oi " +
                                    "JOIN FETCH oi.stock s " +
                                    "JOIN FETCH s.product p " +
                                    "JOIN FETCH s.color " +
                                    "JOIN FETCH s.size " +
                                    "WHERE oi.order.id = :id", OrderItem.class)
                    .setParameter("id", id)
                    .list();

            Map<String, Object> data = new HashMap<>();
            data.put("id", o.getId());
            data.put("orderCode", "NF-" + String.format("%06d", o.getId()));
            data.put("orderNotes", o.getOrderNotes());
            data.put("totalAmount", o.getTotalAmount());
            data.put("paymentMethod", o.getPaymentMethod().getName());
            data.put("statusId", o.getOrderStatus().getId());
            data.put("statusName", o.getOrderStatus().getName());

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            data.put("orderDate", o.getOrderDate() != null ? o.getOrderDate().format(formatter) : "");

            Map<String, Object> customer = new HashMap<>();
            customer.put("name", o.getUser().getFirstName() + " " + o.getUser().getLastName());
            customer.put("email", o.getUser().getEmail());
            customer.put("mobile", o.getUser().getMobile());
            data.put("customer", customer);

            Map<String, Object> address = new HashMap<>();
            address.put("line1", o.getAddress().getLine1());
            address.put("line2", o.getAddress().getLine2());
            address.put("postalCode", o.getAddress().getPostalCode());
            address.put("city", o.getAddress().getCity().getName());
            data.put("address", address);

            List<Map<String, Object>> itemDetails = new ArrayList<>();
            for (OrderItem oi : items) {
                Map<String, Object> item = new HashMap<>();
                item.put("productTitle", oi.getStock().getProduct().getTitle());
                item.put("color", oi.getStock().getColor().getName());
                item.put("size", oi.getStock().getSize().getName());
                item.put("qty", oi.getQty());
                item.put("unitPrice", oi.getUnitPrice());
                item.put("totalPrice", oi.getQty() * oi.getUnitPrice());
                itemDetails.add(item);
            }
            data.put("items", itemDetails);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Order details retrieved successfully");
            responseDTO.setData(data);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error loading order details: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("/update-status")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateOrderStatus(Map<String, Object> payload) {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();
            int orderId = ((Number) payload.get("orderId")).intValue();
            int statusId = ((Number) payload.get("statusId")).intValue();

            Order o = session.get(Order.class, orderId);
            if (o == null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Order not found");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            o.setOrderStatus(session.getReference(OrderStatus.class, statusId));
            session.merge(o);
            transaction.commit();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Order status updated successfully");
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error updating order status: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
