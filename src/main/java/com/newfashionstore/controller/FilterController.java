package com.newfashionstore.controller;

import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.Brand;
import com.newfashionstore.entity.Category;
import com.newfashionstore.util.HibernateUtil;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/filters")
public class FilterController {

    @GET
    @Path("/all")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllFilters() {
        ResponseDTO responseDTO = new ResponseDTO();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<Category> categoryList = session.createQuery("FROM Category", Category.class).list();
            List<Brand> brandList = session.createQuery("FROM Brand", Brand.class).list();

            Map<String, Object> filters = new HashMap<>();
            filters.put("categories", categoryList);
            filters.put("brands", brandList);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Filters loaded successfully.");
            responseDTO.setData(filters);

            return Response.ok().entity(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to load filters: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @GET
    @Path("/brands")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getBrands() {
        ResponseDTO responseDTO = new ResponseDTO();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<Brand> brandList = session.createQuery("FROM Brand", Brand.class).list();

            Map<String, Object> data = new HashMap<>();
            data.put("brands", brandList);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Filters loaded successfully.");
            responseDTO.setData(data);

            return Response.ok().entity(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to load brands: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
