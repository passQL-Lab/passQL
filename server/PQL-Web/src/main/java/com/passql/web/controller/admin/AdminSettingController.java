package com.passql.web.controller.admin;

import com.passql.meta.entity.AppSetting;
import com.passql.meta.service.AppSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/admin/settings")
@RequiredArgsConstructor
public class AdminSettingController {

    private final AppSettingService appSettingService;

    @GetMapping
    public String list(Model model) {
        List<AppSetting> settings = appSettingService.findAll();

        // 민감 키는 값을 마스킹해서 전달
        List<SettingView> views = settings.stream()
                .map(s -> new SettingView(
                        s.getSettingKey(),
                        s.getValueType(),
                        AppSettingService.isSensitiveKey(s.getSettingKey())
                                ? AppSettingService.maskValue(s.getValueText())
                                : s.getValueText(),
                        s.getCategory(),
                        s.getDescription(),
                        AppSettingService.isSensitiveKey(s.getSettingKey())
                ))
                .toList();

        model.addAttribute("settings", views);
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

    public record SettingView(
            String settingKey,
            String valueType,
            String valueText,
            String category,
            String description,
            boolean sensitive
    ) {}
}
