package com.newfashionstore.dto;

import com.newfashionstore.entity.Status;
import jakarta.persistence.ManyToOne;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

public class ProductDTO implements Serializable {
    private int id;
    private String title;
    private String description;
    private String categoryName;
    private String brandName;
    private double minPrice;
    private List<String> images;
    private int defStockId;
    private boolean isWishlisted;
    private LocalDateTime addedDate;

    //status
    @ManyToOne
    private Status status;

    public ProductDTO() {
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getBrandName() {
        return brandName;
    }

    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }

    public double getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(double minPrice) {
        this.minPrice = minPrice;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public int getDefStockId() {
        return defStockId;
    }

    public void setDefStockId(int defStockId) {
        this.defStockId = defStockId;
    }

    public boolean isWishlisted() {
        return isWishlisted;
    }

    public void setWishlisted(boolean wishlisted) {
        isWishlisted = wishlisted;
    }

    public LocalDateTime getAddedDate() {
        return addedDate;
    }

    public void setAddedDate(LocalDateTime addedDate) {
        this.addedDate = addedDate;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
