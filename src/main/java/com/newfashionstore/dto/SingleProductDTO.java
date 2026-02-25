package com.newfashionstore.dto;

import java.util.List;

public class SingleProductDTO {
    private int id;
    private String title;
    private String description;
    private String brand;
    private String category;
    private List<String> imageList;
    private List<StockDTO> stockList;
    private boolean isWishlisted;
    private boolean inCart;
    private int qtyInCart;

    public SingleProductDTO() {
    }

    public int getQtyInCart() {
        return qtyInCart;
    }

    public void setQtyInCart(int qtyInCart) {
        this.qtyInCart = qtyInCart;
    }

    public boolean isWishlisted() {
        return isWishlisted;
    }

    public void setWishlisted(boolean wishlisted) {
        isWishlisted = wishlisted;
    }

    public boolean isInCart() {
        return inCart;
    }

    public void setInCart(boolean inCart) {
        this.inCart = inCart;
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

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<String> getImageList() {
        return imageList;
    }

    public void setImageList(List<String> imageList) {
        this.imageList = imageList;
    }

    public List<StockDTO> getStockList() {
        return stockList;
    }

    public void setStockList(List<StockDTO> stockList) {
        this.stockList = stockList;
    }

    public static class StockDTO {
        private int id;
        private String colorName;
        private String colorCode;
        private String size;
        private int qty;
        private double price;

        public StockDTO() {
        }

        public double getPrice() {
            return price;
        }

        public void setPrice(double price) {
            this.price = price;
        }

        public int getId() {
            return id;
        }

        public void setId(int id) {
            this.id = id;
        }

        public String getColorName() {
            return colorName;
        }

        public void setColorName(String colorName) {
            this.colorName = colorName;
        }

        public String getColorCode() {
            return colorCode;
        }

        public void setColorCode(String colorCode) {
            this.colorCode = colorCode;
        }

        public String getSize() {
            return size;
        }

        public void setSize(String size) {
            this.size = size;
        }

        public int getQty() {
            return qty;
        }

        public void setQty(int qty) {
            this.qty = qty;
        }
    }
}
