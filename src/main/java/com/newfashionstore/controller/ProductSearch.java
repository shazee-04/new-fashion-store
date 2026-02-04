package com.newfashionstore.controller;

import com.newfashionstore.dto.ProductDTO;
import com.newfashionstore.entity.Product;
import com.newfashionstore.entity.ProductImage;
import com.newfashionstore.util.HibernateUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Session;
import org.hibernate.query.Query;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
            @QueryParam("size") @DefaultValue("8") int size) {

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            // Base Query
            StringBuilder hql = new StringBuilder("SELECT DISTINCT p FROM Product p " +
                    "JOIN FETCH p.category " +
                    "JOIN FETCH p.brand " +
                    "WHERE p.status.id = 1");
            StringBuilder countHql = new StringBuilder("SELECT COUNT(DISTINCT p) FROM Product p WHERE p.status.id = 1");


            Map<String, Object> params = new HashMap<>();

            if (searchText != null && !searchText.trim().isEmpty()) {
                String filter = " AND (p.title REGEXP :searchText OR p.description REGEXP :searchText)";
                hql.append(filter);
                countHql.append(filter);
                String regex = String.join("|", searchText.split("\\s+"));
                params.put("searchText", regex);
            }

            if (category != null && !category.isEmpty()) {
                String filter = " AND p.category.name = :category";
                hql.append(filter);
                countHql.append(filter);
                params.put("category", category);
            }

            if (brand != null && !brand.isEmpty()) {
                String filter = " AND p.brand.name = :brand";
                hql.append(filter);
                countHql.append(filter);
                params.put("brand", brand);
            }


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

            // Create Queries
            Query<Product> query = session.createQuery(hql.toString(), Product.class);
            Query<Long> countQuery = session.createQuery(countHql.toString(), Long.class);

            // Set Parameters
            params.forEach((param, value) -> {
                query.setParameter(param, value);
                countQuery.setParameter(param, value);
            });

            // Pagination
            query.setFirstResult(page * size);
            query.setMaxResults(size);

            List<ProductDTO> dtoList = query.list().stream().map(p -> {
                ProductDTO dto = new ProductDTO();
                dto.setId(p.getId());
                dto.setTitle(p.getTitle());
                dto.setDescription(p.getDescription());
                dto.setCategoryName(p.getCategory().getName());
                dto.setBrandName(p.getBrand().getName());

                // Set Price
                Double price = session.createQuery(
                                "SELECT MIN(s.price) FROM Stock s WHERE s.product.id = :pid", Double.class)
                        .setParameter("pid", p.getId())
                        .uniqueResult();
                dto.setMinPrice(price != null ? price : 0.0);

                // Set Images
                List<String> images = session.createQuery(
                                "SELECT pi.path FROM ProductImage pi WHERE pi.product.id = :pid", String.class)
                        .setParameter("pid", p.getId())
                        .list();
                dto.setImages(images);
                return dto;
            }).toList();

            Map<String, Object> response = new HashMap<>();
            response.put("products", dtoList);
            response.put("totalCount", countQuery.uniqueResult());

            return Response.ok(response).build();
        }
    }
}
