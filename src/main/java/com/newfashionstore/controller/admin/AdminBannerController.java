package com.newfashionstore.controller.admin;

import com.newfashionstore.annotations.AdminOnly;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.Banner;
import com.newfashionstore.entity.Status;
import com.newfashionstore.util.HibernateUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/admin/banners")
@AdminOnly
public class AdminBannerController {

    @GET
    @Path("/list")
    @Produces(MediaType.APPLICATION_JSON)
    public Response listBanners() {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<Banner> banners = session.createQuery(
                            "FROM Banner b JOIN FETCH b.status ORDER BY b.id DESC", Banner.class)
                    .list();

            List<Map<String, Object>> bannerList = new ArrayList<>();
            for (Banner b : banners) {
                Map<String, Object> bMap = new HashMap<>();
                bMap.put("id", b.getId());
                bMap.put("title", b.getTitle());
                bMap.put("description", b.getDescription());
                bMap.put("imagePath", b.getImagePath());
                bMap.put("url", b.getUrl());
                bMap.put("statusId", b.getStatus().getId());
                bMap.put("statusName", b.getStatus().getName());
                bannerList.add(bMap);
            }

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Banners loaded successfully");
            responseDTO.setData(bannerList);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error listing banners: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("/save")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response saveBanner(Map<String, Object> payload) {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            int id = ((Number) payload.getOrDefault("id", 0)).intValue();
            String title = (String) payload.get("title");
            String description = (String) payload.get("description");
            String imagePath = (String) payload.get("imagePath");
            String url = (String) payload.get("url");
            int statusId = ((Number) payload.get("statusId")).intValue();

            Banner b;
            if (id > 0) {
                b = session.get(Banner.class, id);
                if (b == null) {
                    responseDTO.setSuccess(false);
                    responseDTO.setMessage("Banner not found");
                    return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
                }
            } else {
                b = new Banner();
            }

            b.setTitle(title);
            b.setDescription(description);
            b.setImagePath(imagePath);
            b.setUrl(url);
            b.setStatus(session.getReference(Status.class, statusId));

            if (id > 0) {
                session.merge(b);
            } else {
                session.persist(b);
            }

            transaction.commit();
            responseDTO.setSuccess(true);
            responseDTO.setMessage("Banner saved successfully");
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error saving banner: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @DELETE
    @Path("/delete")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteBanner(@QueryParam("id") int id) {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();
            Banner b = session.get(Banner.class, id);
            if (b == null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Banner not found");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            session.remove(b);
            transaction.commit();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Banner deleted successfully");
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error deleting banner: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
