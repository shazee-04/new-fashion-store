package com.newfashionstore.config;

import org.glassfish.jersey.server.ResourceConfig;

public class AppConfig extends ResourceConfig {
    public AppConfig() {
        packages("com.newfashionstore.controller");
        packages("com.newfashionstore.filter");
        packages("com.newfashionstore.util");
    }
}
