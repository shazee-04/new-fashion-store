package com.newfashionstore.controller;

import com.newfashionstore.annotations.Secure;
import com.newfashionstore.dto.OrderSummaryDTO;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.Order;
import com.newfashionstore.entity.User;
import com.newfashionstore.util.HibernateUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/orders")
@Secure
public class OrderController {

    @GET
    @Path("/list")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getOrders(@Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();
        User user = (User) request.getSession().getAttribute("user");

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<Order> orders = session.createQuery(
                            "FROM Order o JOIN FETCH o.orderStatus s WHERE o.user.id = :uid ORDER BY o.orderDate DESC",
                            Order.class)
                    .setParameter("uid", user.getId())
                    .list();

            List<OrderSummaryDTO> summaries = new ArrayList<>();
            for (Order order : orders) {
                OrderSummaryDTO dto = new OrderSummaryDTO();
                dto.setId(order.getId());
                dto.setOrderCode("NF-" + order.getId());
                dto.setOrderDate(order.getOrderDate() != null ? order.getOrderDate().toString() : "");
                dto.setStatus(order.getOrderStatus() != null ? order.getOrderStatus().getName() : "");
                dto.setTotalAmount(order.getTotalAmount() == null ? 0 : order.getTotalAmount().doubleValue());
                summaries.add(dto);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("orders", summaries);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Orders loaded successfully.");
            responseDTO.setData(data);
            return Response.ok().entity(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to load orders: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}