package com.newfashionstore.controller.admin;

import com.newfashionstore.annotations.AdminOnly;
import com.newfashionstore.dto.ProductDTO;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.*;
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

@Path("/admin/products")
@AdminOnly
public class AdminProductController {

    @GET
    @Path("/list")
    @Produces(MediaType.APPLICATION_JSON)
    public Response listProducts() {
        ResponseDTO responseDTO = new ResponseDTO();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            String query = "SELECT DISTINCT p FROM Product p " +
                    "LEFT JOIN FETCH p.category " +
                    "LEFT JOIN FETCH p.brand " +
                    "LEFT JOIN FETCH p.status " +
                    "ORDER BY p.addedDate DESC";
            List<Product> products = session.createQuery(query, Product.class).list();

            List<ProductDTO> productDTOList = new ArrayList<>();
            for (Product p : products) {
                ProductDTO dto = new ProductDTO();
                dto.setId(p.getId());
                dto.setTitle(p.getTitle());
                dto.setCategoryName(p.getCategory().getName());
                dto.setBrandName(p.getBrand().getName());
                dto.setStatus(p.getStatus());
                dto.setAddedDate(p.getAddedDate());

                productDTOList.add(dto);
            }
            responseDTO.setData(productDTOList);
            responseDTO.setMessage("Products listed successfully");
            responseDTO.setSuccess(true);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setMessage("Error listing products: " + e.getMessage());
            responseDTO.setSuccess(false);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @GET
    @Path("/detail")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getProductDetail(@QueryParam("id") int id) {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Product p = session.get(Product.class, id);
            if (p == null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Product not found");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            // Fetch images
            List<ProductImage> images = session.createQuery("FROM ProductImage WHERE product.id = :pid", ProductImage.class)
                    .setParameter("pid", id).list();

            // Fetch stocks
            List<Stock> stocks = session.createQuery("FROM Stock WHERE product.id = :pid", Stock.class)
                    .setParameter("pid", id).list();

            Map<String, Object> data = new HashMap<>();
            data.put("id", p.getId());
            data.put("title", p.getTitle());
            data.put("description", p.getDescription());
            data.put("categoryId", p.getCategory().getId());
            data.put("brandId", p.getBrand().getId());
            data.put("statusId", p.getStatus().getId());

            List<Map<String, Object>> imageList = new ArrayList<>();
            for (ProductImage img : images) {
                Map<String, Object> imgMap = new HashMap<>();
                imgMap.put("id", img.getId());
                imgMap.put("path", img.getPath());
                imgMap.put("isPrimary", img.getPrimary());
                imageList.add(imgMap);
            }
            data.put("images", imageList);

            List<Map<String, Object>> stockList = new ArrayList<>();
            for (Stock s : stocks) {
                Map<String, Object> stMap = new HashMap<>();
                stMap.put("id", s.getId());
                stMap.put("price", s.getPrice());
                stMap.put("qty", s.getQuantity());
                stMap.put("colorId", s.getColor().getId());
                stMap.put("sizeId", s.getSize().getId());
                stockList.add(stMap);
            }
            data.put("stocks", stockList);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Product loaded successfully");
            responseDTO.setData(data);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error loading product: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("/save")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response saveProduct(Map<String, Object> payload) {
        ResponseDTO responseDTO = new ResponseDTO();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();

            int id = ((Number) payload.getOrDefault("id", 0)).intValue();
            String title = (String) payload.get("title");
            String description = (String) payload.get("description");
            int categoryId = ((Number) payload.get("categoryId")).intValue();
            int brandId = ((Number) payload.get("brandId")).intValue();
            int statusId = ((Number) payload.get("statusId")).intValue();

            Product p;
            if (id > 0) {
                p = session.get(Product.class, id);
                if (p == null) {
                    responseDTO.setSuccess(false);
                    responseDTO.setMessage("Product not found");
                    return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
                }
            } else {
                p = new Product();
            }

            p.setTitle(title);
            p.setDescription(description);
            p.setCategory(session.getReference(Category.class, categoryId));
            p.setBrand(session.getReference(Brand.class, brandId));
            p.setStatus(session.getReference(Status.class, statusId));

            if (id > 0) {
                session.merge(p);
            } else {
                session.persist(p);
            }
            session.flush();

            // Handle images: delete existing ones and re-insert the list
            if (id > 0) {
                session.createMutationQuery("DELETE FROM ProductImage WHERE product.id = :pid")
                        .setParameter("pid", p.getId())
                        .executeUpdate();
            }

            List<Map<String, Object>> imagePayloads = (List<Map<String, Object>>) payload.get("images");
            if (imagePayloads != null) {
                for (Map<String, Object> imgPayload : imagePayloads) {
                    ProductImage img = new ProductImage();
                    img.setProduct(p);
                    img.setPath((String) imgPayload.get("path"));
                    img.setPrimary((Boolean) imgPayload.getOrDefault("isPrimary", false));
                    session.persist(img);
                }
            }

            // Handle stock variations: match by color & size
            List<Map<String, Object>> stockPayloads = (List<Map<String, Object>>) payload.get("stocks");
            if (stockPayloads != null) {
                for (Map<String, Object> skPayload : stockPayloads) {
                    int colorId = ((Number) skPayload.get("colorId")).intValue();
                    int sizeId = ((Number) skPayload.get("sizeId")).intValue();
                    double price = ((Number) skPayload.get("price")).doubleValue();
                    int qty = ((Number) skPayload.get("qty")).intValue();

                    Stock stock = session.createQuery(
                                    "FROM Stock WHERE product.id = :pid AND color.id = :cid AND size.id = :sid", Stock.class)
                            .setParameter("pid", p.getId())
                            .setParameter("cid", colorId)
                            .setParameter("sid", sizeId)
                            .uniqueResult();

                    if (stock == null) {
                        stock = new Stock();
                        stock.setProduct(p);
                        stock.setColor(session.getReference(Color.class, colorId));
                        stock.setSize(session.getReference(Size.class, sizeId));
                    }
                    stock.setPrice(price);
                    stock.setQuantity(qty);

                    session.merge(stock);
                }
            }

            transaction.commit();
            responseDTO.setSuccess(true);
            responseDTO.setMessage("Product saved successfully");
            responseDTO.setData(p.getId());
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error saving product: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @POST
    @Path("/update-status")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateStatus(Map<String, Object> payload) {
        ResponseDTO responseDTO = new ResponseDTO();
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Transaction transaction = session.beginTransaction();
            int id = ((Number) payload.get("id")).intValue();
            int statusId = ((Number) payload.get("statusId")).intValue();

            Product p = session.get(Product.class, id);
            if (p == null) {
                responseDTO.setSuccess(false);
                responseDTO.setMessage("Product not found");
                return Response.status(Response.Status.NOT_FOUND).entity(responseDTO).build();
            }

            p.setStatus(session.getReference(Status.class, statusId));
            session.merge(p);
            transaction.commit();

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Product status updated successfully");
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Error updating status: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}
