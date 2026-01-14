package com.newfashionstore.controller;

import com.newfashionstore.dto.ProductDTO;
import com.newfashionstore.entity.Product;
import com.newfashionstore.entity.ProductImage;
import com.newfashionstore.util.HibernateUtil;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.hibernate.Session;
import org.hibernate.query.Query;

import java.util.ArrayList;
import java.util.List;

@Path("/products")
public class ProductSearch {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<ProductDTO> getAllProducts() {
        List<ProductDTO> productDTOList = new ArrayList<>();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            Query<Product> query = session.createQuery("FROM Product WHERE status.id = 1", Product.class);
            List<Product> products = query.list();

            for (Product p : products) {
                ProductDTO productDTO = new ProductDTO();

                productDTO.setId(p.getId());
                productDTO.setTitle(p.getTitle());
                productDTO.setDescription(p.getDescription());
                productDTO.setCategoryName(p.getCategory().getName());
                productDTO.setBrandName(p.getBrand().getName());

                Query<ProductImage> imgQuery = session.createQuery("FROM ProductImage WHERE product.id = :pid", ProductImage.class);
                imgQuery.setParameter("pid", p.getId());
                List<String> imagePaths = imgQuery.list().stream().map(ProductImage::getPath).toList();
                productDTO.setImages(imagePaths);

                Query<Double> priceQuery = session.createQuery(
                        "SELECT MIN(price) FROM Stock WHERE product.id = :pid", Double.class);
                priceQuery.setParameter("pid", p.getId());
                productDTO.setMinPrice(priceQuery.uniqueResult());

                productDTOList.add(productDTO);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return productDTOList;
    }
}
