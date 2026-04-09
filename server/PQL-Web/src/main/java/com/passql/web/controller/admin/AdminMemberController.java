package com.passql.web.controller.admin;

import com.passql.member.constant.MemberRole;
import com.passql.member.constant.MemberStatus;
import com.passql.member.dto.MemberSearchCondition;
import com.passql.member.dto.MemberSuspendRequest;
import com.passql.member.service.MemberAdminService;
import com.passql.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Controller
@RequestMapping("/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

    private final MemberAdminService memberAdminService;
    private final SubmissionService submissionService;

    @GetMapping
    public String list(MemberSearchCondition condition, Model model,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size) {
        int clampedPage = Math.max(0, page);
        int clampedSize = Math.min(Math.max(1, size), 100);
        Pageable pageable = PageRequest.of(clampedPage, clampedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        model.addAttribute("members", memberAdminService.searchMembers(condition, pageable));
        model.addAttribute("condition", condition);
        model.addAttribute("statuses", MemberStatus.values());
        model.addAttribute("roles", MemberRole.values());
        model.addAttribute("pageTitle", "회원 관리");
        model.addAttribute("currentMenu", "members");
        return "admin/members/list";
    }

    @GetMapping("/{memberUuid}")
    public String detail(@PathVariable UUID memberUuid, Model model) {
        model.addAttribute("member", memberAdminService.getMemberDetail(memberUuid));
        model.addAttribute("submissions", submissionService.getSubmissionsByMember(memberUuid));
        model.addAttribute("pageTitle", "회원 상세");
        model.addAttribute("currentMenu", "members");
        return "admin/members/detail";
    }

    @PostMapping("/{memberUuid}/suspend")
    @ResponseBody
    public ResponseEntity<Void> suspend(@PathVariable UUID memberUuid,
                                        @RequestBody MemberSuspendRequest request) {
        memberAdminService.suspendMember(memberUuid, request.getReason(), request.getSuspendUntil());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{memberUuid}/unsuspend")
    @ResponseBody
    public ResponseEntity<Void> unsuspend(@PathVariable UUID memberUuid) {
        memberAdminService.unsuspendMember(memberUuid);
        return ResponseEntity.ok().build();
    }
}
