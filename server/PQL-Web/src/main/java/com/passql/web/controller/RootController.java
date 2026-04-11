package com.passql.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 루트 경로 리다이렉트 컨트롤러.
 *
 * <p>localhost:8080 으로 접속하면 관리자 대시보드로 바로 이동한다.
 */
@Controller
public class RootController {

    @GetMapping("/")
    public String root() {
        return "redirect:/admin";
    }
}
