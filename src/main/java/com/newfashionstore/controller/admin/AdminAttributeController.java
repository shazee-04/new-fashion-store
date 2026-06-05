package com.newfashionstore.controller.admin;

import com.newfashionstore.annotations.AdminOnly;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.Brand;
import com.newfashionstore.entity.Category;
import com.newfashionstore.entity.Color;
import com.newfashionstore.entity.Size;
import com.newfashionstore.util.HibernateUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/admin/attributes")
@AdminOnly
public class AdminAttributeController {

    @GET
    @Path("/list")
    @Produces(MediaType.APPLICATION_JSON)
    public Response listAttributes() {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<Category> categories = session.createQuery("FROM Category ORDER BY name ASC", Category.class).list();
            List<Brand> brands = session.createQuery("FROM Brand ORDER BY name ASC", Brand.class).list();
            List<Color> colors = session.createQuery("FROM Color ORDER BY name ASC", Color.class).list();
            List<Size> sizes = session.createQuery("FROM Size ORDER BY name ASC", Size.class).list();

            Map<String, Object> data = new HashMap<>();
            data.put("categories", categories);
            data.put("brands", brands);
            data.put("colors", colors);
            data.put("sizes", sizes);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Attributes loaded successfully");
            responseDTO.setData(data);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error listing attributes: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("/category/save")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response saveCategory(Map<String, Object> payload) {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();
            String name = (String) payload.get("name");
            if (name == null || name.trim().isEmpty()) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Category name is required");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }

            Category cat = new Category();
            cat.setName(name.trim());
            session.persist(cat);
            transaction.commit();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Category created successfully");
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error saving category: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("/brand/save")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response saveBrand(Map<String, Object> payload) {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();
            String name = (String) payload.get("name");
            String path = (String) payload.get("path"); // Image path for brand logo
            if (name == null || name.trim().isEmpty()) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Brand name is required");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }

            Brand br = new Brand();
            br.setName(name.trim());
            br.setPath(path != null ? path.trim() : "");
            session.persist(br);
            transaction.commit();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Brand created successfully");
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error saving brand: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("/color/save")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response saveColor(Map<String, Object> payload) {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();
            String name = (String) payload.get("name");
            String code = (String) payload.get("code");
            if (name == null || name.trim().isEmpty() || code == null || code.trim().isEmpty()) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Color name and hex code are required");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }

            Color cl = new Color();
            cl.setName(name.trim());
            cl.setCode(code.trim());
            session.persist(cl);
            transaction.commit();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Color created successfully");
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error saving color: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("/size/save")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response saveSize(Map<String, Object> payload) {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();
            String name = (String) payload.get("name");
            if (name == null || name.trim().isEmpty()) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Size label is required");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }

            Size sz = new Size();
            sz.setName(name.trim());
            session.persist(sz);
            transaction.commit();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Size created successfully");
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error saving size: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
