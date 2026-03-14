package com.newfashionstore.controller;

import com.newfashionstore.annotations.Secure;
import com.newfashionstore.dto.AddressDTO;
import com.newfashionstore.dto.CityDTO;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.Address;
import com.newfashionstore.entity.City;
import com.newfashionstore.entity.User;
import com.newfashionstore.util.HibernateUtil;
import jakarta.annotation.Nonnull;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/profile")
@Secure
public class ProfileController {

    @Nonnull
    private static AddressDTO getAddressDTO(Address address) {
        AddressDTO addressDTO = new AddressDTO();
        addressDTO.setId(address.getId());
        addressDTO.setUserId(address.getUser().getId());
        addressDTO.setFirstName(address.getUser().getFirstName());
        addressDTO.setLastName(address.getUser().getLastName());
        addressDTO.setEmail(address.getUser().getEmail());
        addressDTO.setMobile(address.getUser().getMobile());
        addressDTO.setLineOne(address.getLine1());
        addressDTO.setLineTwo(address.getLine2());
        addressDTO.setPostalCode(address.getPostalCode());
        addressDTO.setPrimary(address.getPrimary());

        CityDTO cityDTO = new CityDTO();
        cityDTO.setId(address.getCity().getId());
        cityDTO.setName(address.getCity().getName());
        addressDTO.setCity(cityDTO);
        return addressDTO;
    }

    @GET
    @Path("/address/list")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUserProfile(@Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();
        User user = (User) request.getSession().getAttribute("user");

        List<AddressDTO> addressDTOList = new ArrayList<>();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<Address> addressList = session.createQuery("FROM Address a " +
                            "JOIN FETCH a.user u " +
                            "JOIN FETCH a.city c " +
                            "JOIN FETCH u.status s " +
                            "JOIN FETCH u.userType ut " +
                            "WHERE u.id = :uid", Address.class)
                    .setParameter("uid", user.getId())
                    .list();

            if (addressList != null) {
                for (Address address : addressList) {
                    AddressDTO addressDTO = getAddressDTO(address);
                    addressDTOList.add(addressDTO);
                }

                Map<String, Object> data = new HashMap<>();
                data.put("addresses", addressDTOList);

                responseDTO.setSuccess(true);
                responseDTO.setMessage("Profile data retrieved successfully.");
                responseDTO.setData(data);
                return Response.ok().entity(responseDTO).build();
            } else {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Profile data not found.");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed retrieving profile data:" + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("address/add")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addAddress(@Context HttpServletRequest request, @Nonnull @Valid AddressDTO addressDTO) {
        ResponseDTO responseDTO = new ResponseDTO();
        User user = (User) request.getSession().getAttribute("user");

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            if (addressDTO.getId() > 0) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("New address should not have an ID.");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }

            int existingAddressesCount = session.createQuery(
                            "SELECT COUNT(a) FROM Address a WHERE a.user.id = :uid", Long.class)
                    .setParameter("uid", user.getId())
                    .uniqueResult()
                    .intValue();

            if (existingAddressesCount > 0) {
                addressDTO.setPrimary(false);
            }

            if (existingAddressesCount == 0) {
                addressDTO.setPrimary(true);
            }

            if (existingAddressesCount >= 3) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Address limit reached. You can only have up to 3 addresses.");
                return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
            }

            Address address = new Address();
            address.setLine1(addressDTO.getLineOne());
            address.setLine2(addressDTO.getLineTwo());
            address.setPostalCode(addressDTO.getPostalCode());
            address.setCity(session.getReference(City.class, addressDTO.getCity().getId()));
            address.setUser(session.getReference(User.class, user.getId()));

            session.persist(address);
            session.flush();
            transaction.commit();

            Map<String, Object> data = new HashMap<>();
            data.put("addressId", address.getId());

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Address saved successfully!");
            responseDTO.setData(data);
            return Response.ok().entity(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to add address: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("address/update")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateAddress(@Context HttpServletRequest request, @Nonnull @Valid AddressDTO addressDTO) {
        ResponseDTO responseDTO = new ResponseDTO();
        User user = (User) request.getSession().getAttribute("user");

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            Address address = session.get(Address.class, addressDTO.getId());
            if (address == null || address.getUser().getId() != user.getId()) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Address not found or does not belong to the user.");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            address.setLine1(addressDTO.getLineOne());
            address.setLine2(addressDTO.getLineTwo());
            address.setPostalCode(addressDTO.getPostalCode());
            address.setCity(session.getReference(City.class, addressDTO.getCity().getId()));

            session.merge(address);
            transaction.commit();

            Map<String, Object> data = new HashMap<>();
            data.put("addressId", address.getId());

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Address updated successfully!");
            responseDTO.setData(data);
            return Response.ok().entity(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to update address: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
