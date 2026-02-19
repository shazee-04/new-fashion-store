package com.newfashionstore.config;

import jakarta.ws.rs.ApplicationPath;
import org.glassfish.jersey.server.ResourceConfig;

public class AppConfig extends ResourceConfig {
    public AppConfig() {
        packages("com.newfashionstore.controller");
        packages("com.newfashionstore.filter");
    }
}
