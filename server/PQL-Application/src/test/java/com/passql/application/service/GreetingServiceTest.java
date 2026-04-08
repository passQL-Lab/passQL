package com.passql.application.service;

import com.passql.application.dto.GreetingResponse;
import com.passql.common.exception.CustomException;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import com.passql.meta.entity.ExamSchedule;
import com.passql.meta.constant.CertType;
import com.passql.meta.repository.ExamScheduleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GreetingServiceTest {

    @Mock MemberRepository memberRepository;
    @Mock ExamScheduleRepository examScheduleRepository;
    @InjectMocks GreetingService greetingService;

    UUID memberUuid;
    Member member;

    @BeforeEach
    void setUp() {
        memberUuid = UUID.randomUUID();
        member = org.mockito.Mockito.mock(Member.class);
        org.mockito.Mockito.lenient().when(member.getNickname()).thenReturn("테스터");
    }

    @Test
    @DisplayName("존재하지 않는 memberUuid → MEMBER_NOT_FOUND 예외")
    void memberNotFound() {
        when(memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> greetingService.getGreeting(memberUuid))
                .isInstanceOf(CustomException.class);
    }

    @Test
    @DisplayName("시험 없음 → message가 null이 아니고 비어있지 않음")
    void noExam() {
        when(memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid))
                .thenReturn(Optional.of(member));
        when(examScheduleRepository.findFirstByIsSelectedTrue())
                .thenReturn(Optional.empty());

        GreetingResponse response = greetingService.getGreeting(memberUuid);

        assertThat(response.message()).isNotBlank();
    }

    @Test
    @DisplayName("dDay == 0 → message에 '오늘' 또는 '시험' 포함")
    void dDayZero() {
        ExamSchedule exam = org.mockito.Mockito.mock(ExamSchedule.class);
        when(exam.getExamDate()).thenReturn(LocalDate.now());
        when(exam.getCertType()).thenReturn(CertType.SQLD);
        when(memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid))
                .thenReturn(Optional.of(member));
        when(examScheduleRepository.findFirstByIsSelectedTrue())
                .thenReturn(Optional.of(exam));

        GreetingResponse response = greetingService.getGreeting(memberUuid);

        assertThat(response.message()).containsAnyOf("오늘", "시험");
    }

    @Test
    @DisplayName("1 <= dDay <= 7 → message에 'D-' 포함")
    void dDayOneToSeven() {
        ExamSchedule exam = org.mockito.Mockito.mock(ExamSchedule.class);
        when(exam.getExamDate()).thenReturn(LocalDate.now().plusDays(3));
        when(exam.getCertType()).thenReturn(CertType.SQLD);
        when(memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid))
                .thenReturn(Optional.of(member));
        when(examScheduleRepository.findFirstByIsSelectedTrue())
                .thenReturn(Optional.of(exam));

        GreetingResponse response = greetingService.getGreeting(memberUuid);

        assertThat(response.message()).contains("D-");
    }

    @Test
    @DisplayName("8 <= dDay <= 30 → message가 null이 아니고 비어있지 않음")
    void dDayEightToThirty() {
        ExamSchedule exam = org.mockito.Mockito.mock(ExamSchedule.class);
        when(exam.getExamDate()).thenReturn(LocalDate.now().plusDays(15));
        when(exam.getCertType()).thenReturn(CertType.SQLD);
        when(memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid))
                .thenReturn(Optional.of(member));
        when(examScheduleRepository.findFirstByIsSelectedTrue())
                .thenReturn(Optional.of(exam));

        GreetingResponse response = greetingService.getGreeting(memberUuid);

        assertThat(response.message()).isNotBlank();
    }

    @Test
    @DisplayName("dDay > 30 → message에 D-day 숫자가 포함되지 않음")
    void dDayOverThirty() {
        ExamSchedule exam = org.mockito.Mockito.mock(ExamSchedule.class);
        when(exam.getExamDate()).thenReturn(LocalDate.now().plusDays(60));
        when(exam.getCertType()).thenReturn(CertType.SQLD);
        when(memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid))
                .thenReturn(Optional.of(member));
        when(examScheduleRepository.findFirstByIsSelectedTrue())
                .thenReturn(Optional.of(exam));

        GreetingResponse response = greetingService.getGreeting(memberUuid);

        assertThat(response.message()).isNotBlank();
        assertThat(response.message()).doesNotContain("D-60");
    }
}
