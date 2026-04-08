package com.passql.web.controller.admin;

import com.passql.meta.service.AppSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@RequestMapping("/admin/settings")
@RequiredArgsConstructor
public class AdminSettingController {

    private final AppSettingService appSettingService;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("settings", appSettingService.findAllAsView());
        model.addAttribute("currentMenu", "settings");
        model.addAttribute("pageTitle", "앱 설정");
        return "admin/settings";
    }

    @PutMapping("/{key}")
    @ResponseBody
    public ResponseEntity<Void> updateSetting(@PathVariable String key,
                                              @RequestBody Map<String, String> body) {
        if (AppSettingService.isSensitiveKey(key)) {
            return ResponseEntity.status(403).build();
        }
        appSettingService.save(key, body.get("value"));
        return ResponseEntity.ok().build();
    }
}
