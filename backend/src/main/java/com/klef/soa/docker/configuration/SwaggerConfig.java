package com.klef.soa.docker.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Public Library Card Service API")
                        .version("1.0")
                        .description("REST API Documentation for Public Library Card Operations")
                        .contact(new Contact()
                                .name("Cherukuri Venkatesh")
                                .email("2400032597@kluniversity.in")));
    }
}
