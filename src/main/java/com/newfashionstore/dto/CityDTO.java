package com.newfashionstore.dto;

import java.io.Serializable;

public class CityDTO implements Serializable {
    private int id;
    private String name;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getCity() {
        return name;
    }

    public void setCity(String city) {
        this.name = city;
    }
}
