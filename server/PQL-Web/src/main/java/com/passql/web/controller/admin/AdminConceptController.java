package com.passql.web.controller.admin;

import com.passql.meta.entity.ConceptDoc;
import com.passql.meta.entity.ConceptTag;
import com.passql.meta.repository.ConceptDocRepository;
import com.passql.meta.repository.ConceptTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
@RequestMapping("/admin/concepts")
@RequiredArgsConstructor
public class AdminConceptController {

    private final ConceptTagRepository conceptTagRepository;
    private final ConceptDocRepository conceptDocRepository;

    @GetMapping
    public String list(Model model, @RequestParam(required = false) String tagKey) {
        List<ConceptTag> tags = conceptTagRepository.findByIsActiveTrueOrderBySortOrderAsc();
        model.addAttribute("conceptTags", tags);
        model.addAttribute("selectedTagKey", tagKey);
        model.addAttribute("currentMenu", "concepts");
        model.addAttribute("pageTitle", "개념 문서 관리");

        if (tagKey != null) {
            conceptTagRepository.findByTagKey(tagKey).ifPresent(tag -> {
                List<ConceptDoc> docs = conceptDocRepository.findByConceptTagUuid(tag.getConceptTagUuid());
                model.addAttribute("conceptDocs", docs);
            });
        }
        return "admin/concepts";
    }

    @PostMapping
    public String createDoc(@RequestParam String tagKey,
                            @RequestParam String title,
                            @RequestParam(required = false) String bodyMd) {
        conceptTagRepository.findByTagKey(tagKey).ifPresent(tag -> {
            ConceptDoc doc = ConceptDoc.builder()
                    .conceptTagUuid(tag.getConceptTagUuid())
                    .title(title)
                    .bodyMd(bodyMd)
                    .embeddingVersion("v1")
                    .isActive(true)
                    .build();
            conceptDocRepository.save(doc);
        });
        return "redirect:/admin/concepts?tagKey=" + tagKey;
    }

    @PutMapping("/{uuid}")
    @ResponseBody
    @Transactional
    public ResponseEntity<Void> updateDoc(@PathVariable java.util.UUID uuid,
                                          @RequestBody Map<String, String> body) {
        Optional<ConceptDoc> docOpt = conceptDocRepository.findById(uuid);
        if (docOpt.isEmpty()) return ResponseEntity.notFound().build();
        ConceptDoc doc = docOpt.get();
        doc.setBodyMd(body.get("bodyMd"));
        conceptDocRepository.save(doc);
        return ResponseEntity.ok().build();
    }
}
