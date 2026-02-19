package com.newfashionstore.controller;

import com.newfashionstore.dto.BannerDTO;
import com.newfashionstore.dto.ProductDTO;
import com.newfashionstore.dto.ResponseDTO;
import com.newfashionstore.entity.Banner;
import com.newfashionstore.entity.Product;
import com.newfashionstore.entity.Stock;
import com.newfashionstore.entity.User;
import com.newfashionstore.util.HibernateUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.query.Query;

import java.util.*;
import java.util.stream.Collectors;

@Path("/products")
public class ProductSearch {

    @GET
    @Path("/search")
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchProducts(
            @QueryParam("query") String searchText,
            @QueryParam("category") String category,
            @QueryParam("brand") String brand,
            @QueryParam("minPrice") Double minPrice,
            @QueryParam("maxPrice") Double maxPrice,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("8") int size,
            @QueryParam("sort") @DefaultValue("0") int sort,
            @Context HttpServletRequest request) {

        ResponseDTO responseDTO = new ResponseDTO();
        HttpSession httpSession = request.getSession();
        User user = (User) httpSession.getAttribute("user");

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            // Base HQL
            StringBuilder hql = new StringBuilder("SELECT DISTINCT p FROM Product p " +
                    "JOIN FETCH p.category JOIN FETCH p.brand " +
                    "WHERE p.status.id = 1");
            StringBuilder countHql = new StringBuilder("SELECT COUNT(DISTINCT p) FROM Product p WHERE p.status.id = 1");

            Map<String, Object> params = new HashMap<>();

            // Search Logic
            if (searchText != null && !searchText.trim().isEmpty()) {
                String filter = " AND (p.title LIKE :searchText)";
                hql.append(filter);
                countHql.append(filter);
                params.put("searchText", "%" + searchText + "%");
            }

            // Multiple Categories
            if (category != null && !category.isEmpty()) {
                List<String> categoryList = Arrays.asList(category.split(";"));
                String filter = " AND p.category.name IN (:categories)";
                hql.append(filter);
                countHql.append(filter);
                params.put("categories", categoryList);
            }

            // Multiple Brands
            if (brand != null && !brand.isEmpty()) {
                List<String> brandList = Arrays.asList(brand.split(";"));
                String filter = " AND p.brand.name IN (:brands)";
                hql.append(filter);
                countHql.append(filter);
                params.put("brands", brandList);
            }

            // Price Filtering
            if (minPrice != null || maxPrice != null) {
                String priceFilter = " AND p.id IN (SELECT s.product.id FROM Stock s WHERE 1=1";
                if (minPrice != null) priceFilter += " AND s.price >= :minPrice";
                if (maxPrice != null) priceFilter += " AND s.price <= :maxPrice";
                priceFilter += ")";
                hql.append(priceFilter);
                countHql.append(priceFilter);
                if (minPrice != null) params.put("minPrice", minPrice);
                if (maxPrice != null) params.put("maxPrice", maxPrice);
            }

            // Sorting
            switch (sort) {
                case 1:
                    hql.append(" ORDER BY (SELECT MIN(s.price) FROM Stock s WHERE s.product.id = p.id) ASC");
                    break;
                case 2:
                    hql.append(" ORDER BY (SELECT MIN(s.price) FROM Stock s WHERE s.product.id = p.id) DESC");
                    break;
                case 3:
                    hql.append(" ORDER BY p.title ASC");
                    break;
                default:
                    hql.append(" ORDER BY p.id DESC");
                    break;
            }

            // Execute Queries
            Query<Product> query = session.createQuery(hql.toString(), Product.class);
            Query<Long> countQuery = session.createQuery(countHql.toString(), Long.class);

            params.forEach((p, v) -> {
                query.setParameter(p, v);
                countQuery.setParameter(p, v);
            });

            query.setFirstResult(page * size);
            query.setMaxResults(size);

            List<ProductDTO> dtoList = query.list().stream().map(p -> {
                ProductDTO dto = new ProductDTO();
                dto.setId(p.getId());
                dto.setTitle(p.getTitle());
                dto.setCategoryName(p.getCategory().getName());
                dto.setBrandName(p.getBrand().getName());

                // Check If Wishlisted
                if (user != null) {
                    boolean wishlisted = session.createQuery("SELECT COUNT(w) > 0 FROM Wishlist w WHERE w.user.id = :uid AND w.product.id = :pid", Boolean.class)
                            .setParameter("uid", user.getId())
                            .setParameter("pid", p.getId())
                            .uniqueResult();
                    dto.setWishlisted(wishlisted);
                } else {
                    dto.setWishlisted(false);
                }

                // Default Stock ID
                Stock defStock = session.createQuery("FROM Stock s WHERE s.product.id = :pid ORDER BY s.price ASC", Stock.class)
                        .setParameter("pid", p.getId())
                        .setMaxResults(1).uniqueResult();
                dto.setDefStockId(defStock != null ? defStock.getId() : 0);

                // Fetch Min Price
                Double price = session.createQuery("SELECT MIN(s.price) FROM Stock s WHERE s.product.id = :pid", Double.class)
                        .setParameter("pid", p.getId()).uniqueResult();
                dto.setMinPrice(price != null ? price : 0.0);

                // Fetch Images
                List<String> images = session.createQuery("SELECT pi.path FROM ProductImage pi WHERE pi.product.id = :pid", String.class)
                        .setParameter("pid", p.getId()).list();
                dto.setImages(images);
                return dto;
            }).collect(Collectors.toList());

            Map<String, Object> data = new HashMap<>();
            data.put("products", dtoList);
            data.put("totalCount", countQuery.uniqueResult());

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Products loaded successfully!");
            responseDTO.setData(data);

            return Response.ok().entity(responseDTO).build();

        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Product loading failed: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }

    @GET
    @Path("/banner")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getBanners() {
        ResponseDTO responseDTO = new ResponseDTO();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            List<Banner> bannerList = session
                    .createQuery("FROM Banner b WHERE b.status.id = 1 ORDER BY b.id DESC", Banner.class)
                    .list();

            Map<String, Object> banners = new HashMap<>();
            banners.put("banners", bannerList);

            responseDTO.setSuccess(true);
            responseDTO.setMessage("Banners loaded successfully!");
            responseDTO.setData(banners);
            return Response.ok().entity(responseDTO).build();
        } catch (Exception e) {
            responseDTO.setSuccess(false);
            responseDTO.setMessage("Banner loading failed: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseDTO).build();
        }
    }
}