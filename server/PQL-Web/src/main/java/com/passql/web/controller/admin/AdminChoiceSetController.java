package com.passql.web.controller.admin;

import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.entity.QuestionChoiceSet;
import com.passql.question.entity.QuestionChoiceSetItem;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.repository.QuestionChoiceSetRepository;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 관리자 선택지 세트 이력 조회 / 관리.
 */
@Slf4j
@Controller
@RequestMapping("/admin/choice-sets")
@RequiredArgsConstructor
public class AdminChoiceSetController {

    private final QuestionChoiceSetRepository choiceSetRepository;
    private final QuestionChoiceSetItemRepository choiceSetItemRepository;

    @GetMapping
    public String list(Model model,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size) {
        int clampedSize = Math.min(size, 100);
        Page<QuestionChoiceSet> sets = choiceSetRepository.findAll(
                PageRequest.of(page, clampedSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        model.addAttribute("choiceSets", sets);
        model.addAttribute("currentMenu", "choice-sets");
        model.addAttribute("pageTitle", "선택지 세트 이력");
        return "admin/choice-sets";
    }

    @GetMapping("/{uuid}")
    public String detail(@PathVariable UUID uuid, Model model) {
        QuestionChoiceSet set = choiceSetRepository.findById(uuid)
                .orElseThrow(() -> new CustomException(ErrorCode.CHOICE_SET_NOT_FOUND));
        List<QuestionChoiceSetItem> items = choiceSetItemRepository
                .findByChoiceSetUuidOrderBySortOrderAsc(uuid);
        model.addAttribute("choiceSet", set);
        model.addAttribute("items", items);
        model.addAttribute("currentMenu", "choice-sets");
        model.addAttribute("pageTitle", "선택지 세트 상세");
        return "admin/choice-set-detail";
    }

    /**
     * 비활성화.
     */
    @PutMapping("/{uuid}/disable")
    @ResponseBody
    public ResponseEntity<Void> disable(@PathVariable UUID uuid) {
        QuestionChoiceSet set = choiceSetRepository.findById(uuid)
                .orElseThrow(() -> new CustomException(ErrorCode.CHOICE_SET_NOT_FOUND));
        set.setStatus(ChoiceSetStatus.DISABLED);
        choiceSetRepository.save(set);
        return ResponseEntity.ok().build();
    }

    /**
     * 재사용 풀 승격.
     */
    @PutMapping("/{uuid}/promote")
    @ResponseBody
    public ResponseEntity<Void> promote(@PathVariable UUID uuid) {
        QuestionChoiceSet set = choiceSetRepository.findById(uuid)
                .orElseThrow(() -> new CustomException(ErrorCode.CHOICE_SET_NOT_FOUND));
        set.setSource(ChoiceSetSource.ADMIN_CURATED);
        set.setIsReusable(true);
        choiceSetRepository.save(set);
        return ResponseEntity.ok().build();
    }
}
