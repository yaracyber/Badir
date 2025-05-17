package com.badir.blockchain.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    @GetMapping("/")
    public String home() {
        return "index";
    }

    @GetMapping("/donate")
    public String donate() {
        return "donate";
    }

    @GetMapping("/technology")
    public String technology() {
        return "technology";
    }
}