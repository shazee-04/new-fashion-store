package com.newfashionstore.controller;

import com.newfashionstore.annotations.Secure;
import com.newfashionstore.dto.AddressDTO;
import com.newfashionstore.dto.CityDTO;
import com.newfashionstore.dto.ProfileUpdateDTO;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.Address;
import com.newfashionstore.entity.City;
import com.newfashionstore.entity.User;
import com.newfashionstore.util.Encryption;
import com.newfashionstore.util.HibernateUtil;
import com.newfashionstore.util.Validator;
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
import java.util.regex.Pattern;

@Path("/profile")
@Secure
public class ProfileController {

    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$");

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
            address.setPrimary(addressDTO.isPrimary());
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

    @DELETE
    @Path("address/delete")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteAddress(@Context HttpServletRequest request, @QueryParam("addressId") int addressId) {
        ResponseDTO responseDTO = new ResponseDTO();
        User user = (User) request.getSession().getAttribute("user");

        if (addressId <= 0) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Invalid address id.");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            Address address = session.get(Address.class, addressId);
            if (address == null || address.getUser().getId() != user.getId()) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Address not found or does not belong to the user.");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            boolean wasPrimary = Boolean.TRUE.equals(address.getPrimary());
            session.remove(address);

            if (wasPrimary) {
                Address fallback = session.createQuery(
                                "FROM Address a WHERE a.user.id = :uid ORDER BY a.id ASC",
                                Address.class)
                        .setParameter("uid", user.getId())
                        .setMaxResults(1)
                        .uniqueResult();
                if (fallback != null) {
                    fallback.setPrimary(true);
                    session.merge(fallback);
                }
            }

            transaction.commit();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Address removed successfully!");
            return Response.ok().entity(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to delete address: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @GET
    @Path("/details")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getProfileDetails(@Context HttpServletRequest request) {
        ResponseDTO responseDTO = new ResponseDTO();
        User user = (User) request.getSession().getAttribute("user");

        Map<String, Object> data = new HashMap<>();
        data.put("firstName", user.getFirstName());
        data.put("lastName", user.getLastName());
        data.put("email", user.getEmail());
        data.put("mobile", user.getMobile());

        responseDTO.setSuccess(true);
        responseDTO.setMessage("Profile loaded successfully.");
        responseDTO.setData(data);
        return Response.ok().entity(responseDTO).build();
    }

    @POST
    @Path("/update")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateProfile(@Context HttpServletRequest request, @Nonnull @Valid ProfileUpdateDTO updateDTO) {
        ResponseDTO responseDTO = new ResponseDTO();
        User sessionUser = (User) request.getSession().getAttribute("user");

        String password = updateDTO.getPassword() == null ? "" : updateDTO.getPassword().trim();
        if (!password.isEmpty() && !PASSWORD_PATTERN.matcher(password).matches()) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage(
                    "password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        if (!Validator.isValidEmail(updateDTO.getEmail())) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("please provide a valid email address");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        if (!Validator.isValidPhoneNumber(updateDTO.getMobile())) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("mobile must be a valid 10-digit number");
            return Response.status(Response.Status.BAD_REQUEST).entity(responseDTO).build();
        }

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            User user = session.get(User.class, sessionUser.getId());
            if (user == null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("User not found.");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            User emailOwner = session.createQuery(
                            "FROM User u WHERE u.email = :email AND u.id <> :uid", User.class)
                    .setParameter("email", updateDTO.getEmail().trim())
                    .setParameter("uid", user.getId())
                    .setMaxResults(1)
                    .uniqueResult();

            if (emailOwner != null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("This email is already registered.");
                return Response.status(Response.Status.CONFLICT).entity(responseDTO).build();
            }

            user.setFirstName(updateDTO.getFirstName().trim());
            user.setLastName(updateDTO.getLastName().trim());
            user.setEmail(updateDTO.getEmail().trim());
            user.setMobile(updateDTO.getMobile().trim());

            if (!password.isEmpty()) {
                user.setPassword(Encryption.encrypt(password));
            }

            session.merge(user);
            transaction.commit();

            sessionUser.setFirstName(user.getFirstName());
            sessionUser.setLastName(user.getLastName());
            sessionUser.setEmail(user.getEmail());
            sessionUser.setMobile(user.getMobile());

            Map<String, Object> data = new HashMap<>();
            data.put("firstName", user.getFirstName());
            data.put("lastName", user.getLastName());
            data.put("email", user.getEmail());
            data.put("mobile", user.getMobile());

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Profile updated successfully!");
            responseDTO.setData(data);
            return Response.ok().entity(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Failed to update profile: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
