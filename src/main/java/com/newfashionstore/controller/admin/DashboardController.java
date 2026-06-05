package com.newfashionstore.controller.admin;

import com.newfashionstore.annotations.AdminOnly;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.Order;
import com.newfashionstore.entity.Status;
import com.newfashionstore.entity.Subscriber;
import com.newfashionstore.entity.User;
import com.newfashionstore.util.HibernateUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Path("/admin/dashboard")
@AdminOnly
public class DashboardController {

    @GET
    @Path("/stats")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getStats() {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            // Total Sales
            BigDecimal totalSales = session.createQuery("SELECT SUM(o.totalAmount) FROM Order o", BigDecimal.class).uniqueResult();
            if (totalSales == null) {
                totalSales = BigDecimal.ZERO;
            }

            // Total Orders
            long totalOrders = session.createQuery("SELECT COUNT(o) FROM Order o", Long.class).uniqueResult();

            // Total Products
            long totalProducts = session.createQuery("SELECT COUNT(p) FROM Product p", Long.class).uniqueResult();

            // Total Customers
            long totalCustomers = session.createQuery("SELECT COUNT(u) FROM User u WHERE u.userType.id = 2", Long.class).uniqueResult();

            // Low Stock Alert (quantity < 10)
            long lowStockAlerts = session.createQuery("SELECT COUNT(s) FROM Stock s WHERE s.qty < 10", Long.class).uniqueResult();

            // Recent Orders (limit 5)
            List<Order> recentOrdersList = session.createQuery(
                            "SELECT o FROM Order o JOIN FETCH o.user JOIN FETCH o.orderStatus ORDER BY o.orderDate DESC", Order.class)
                    .setMaxResults(5)
                    .list();

            List<Map<String, Object>> recentOrders = new ArrayList<>();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            for (Order o : recentOrdersList) {
                Map<String, Object> orderMap = new HashMap<>();
                orderMap.put("id", o.getId());
                orderMap.put("orderCode", "NF-" + String.format("%06d", o.getId()));
                orderMap.put("customerName", o.getUser().getFirstName() + " " + o.getUser().getLastName());
                orderMap.put("email", o.getUser().getEmail());
                orderMap.put("totalAmount", o.getTotalAmount());
                orderMap.put("status", o.getOrderStatus().getName());
                orderMap.put("orderDate", o.getOrderDate() != null ? o.getOrderDate().format(formatter) : "");
                recentOrders.add(orderMap);
            }

            // Last 7 Days Sales Trend for chart
            List<Order> salesTrendList = session.createQuery(
                            "SELECT o FROM Order o WHERE o.orderDate >= :sevenDaysAgo ORDER BY o.orderDate ASC", Order.class)
                    .setParameter("sevenDaysAgo", java.time.LocalDateTime.now().minusDays(7))
                    .list();

            Map<String, Double> dailySales = new LinkedHashMap<>();
            DateTimeFormatter chartDateFormatter = DateTimeFormatter.ofPattern("MM-dd");

            // Initialize last 7 days with zero
            for (int i = 6; i >= 0; i--) {
                dailySales.put(java.time.LocalDateTime.now().minusDays(i).format(chartDateFormatter), 0.0);
            }

            for (Order o : salesTrendList) {
                String day = o.getOrderDate().format(chartDateFormatter);
                if (dailySales.containsKey(day)) {
                    double amt = o.getTotalAmount() != null ? o.getTotalAmount().doubleValue() : 0.0;
                    dailySales.put(day, dailySales.get(day) + amt);
                }
            }

            List<String> chartLabels = new ArrayList<>(dailySales.keySet());
            List<Double> chartData = new ArrayList<>(dailySales.values());

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalSales", totalSales);
            stats.put("totalOrders", totalOrders);
            stats.put("totalProducts", totalProducts);
            stats.put("totalCustomers", totalCustomers);
            stats.put("lowStockAlerts", lowStockAlerts);
            stats.put("recentOrders", recentOrders);
            stats.put("chartLabels", chartLabels);
            stats.put("chartData", chartData);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Dashboard statistics retrieved successfully");
            responseDTO.setData(stats);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error loading stats: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @GET
    @Path("/users/list")
    @Produces(MediaType.APPLICATION_JSON)
    public Response listUsers() {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<User> users = session.createQuery(
                            "FROM User u JOIN FETCH u.status JOIN FETCH u.userType ORDER BY u.registeredDate DESC", User.class)
                    .list();

            List<Map<String, Object>> userList = new ArrayList<>();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            for (User u : users) {
                Map<String, Object> uMap = new HashMap<>();
                uMap.put("id", u.getId());
                uMap.put("firstName", u.getFirstName());
                uMap.put("lastName", u.getLastName());
                uMap.put("email", u.getEmail());
                uMap.put("mobile", u.getMobile());
                uMap.put("isVerified", u.getVerified());
                uMap.put("userType", u.getUserType().getType());
                uMap.put("statusId", u.getStatus().getId());
                uMap.put("statusName", u.getStatus().getName());
                uMap.put("registeredDate", u.getRegisteredDate() != null ? u.getRegisteredDate().format(formatter) : "");
                uMap.put("lastLogin", u.getLastLogin() != null ? u.getLastLogin().format(formatter) : "Never");
                userList.add(uMap);
            }

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Users retrieved successfully");
            responseDTO.setData(userList);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error loading users: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("/users/update-status")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateUserStatus(Map<String, Object> payload) {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();
            int userId = ((Number) payload.get("userId")).intValue();
            int statusId = ((Number) payload.get("statusId")).intValue();

            User u = session.get(User.class, userId);
            if (u == null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("User not found");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            u.setStatus(session.getReference(Status.class, statusId));
            session.merge(u);
            transaction.commit();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("User status updated successfully");
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error updating user status: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @GET
    @Path("/subscribers/list")
    @Produces(MediaType.APPLICATION_JSON)
    public Response listSubscribers() {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<Subscriber> subscribers = session.createQuery(
                            "FROM Subscriber s JOIN FETCH s.status ORDER BY s.dateSubscribed DESC", Subscriber.class)
                    .list();

            List<Map<String, Object>> subList = new ArrayList<>();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            for (Subscriber s : subscribers) {
                Map<String, Object> sMap = new HashMap<>();
                sMap.put("id", s.getId());
                sMap.put("email", s.getEmail());
                sMap.put("statusName", s.getStatus().getName());
                sMap.put("dateSubscribed", s.getDateSubscribed() != null ? s.getDateSubscribed().format(formatter) : "");
                subList.add(sMap);
            }

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Subscribers loaded successfully");
            responseDTO.setData(subList);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error listing subscribers: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
