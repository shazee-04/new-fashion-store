package com.newfashionstore.controller;

import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.City;
import com.newfashionstore.util.HibernateUtil;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;

import java.util.List;

@Path("/content")
public class ContentController {

    @GET
    @Path("/city/list")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCityList() {
        ResponseDTO responseDTO = new ResponseDTO();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<City> cityList = session.createQuery("FROM City", City.class).list();
            responseDTO.setSuccess(true);
            responseDTO.setData(cityList);
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to load city list: " + e.getMessage());
        }
        return Response.status(Response.Status.OK).entity(responseDTO).build();
    }
}
