package com.passql.application.service;

import com.passql.application.dto.GreetingResponse;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import com.passql.meta.entity.ExamSchedule;
import com.passql.meta.repository.ExamScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GreetingService {

    private final MemberRepository memberRepository;
    private final ExamScheduleRepository examScheduleRepository;

    public GreetingResponse getGreeting(UUID memberUuid) {
        Member member = memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        String nickname = member.getNickname();
        Optional<ExamSchedule> selectedExam = examScheduleRepository.findFirstByIsSelectedTrue();

        String message = buildMessage(nickname, selectedExam, LocalDate.now(), LocalTime.now());
        return new GreetingResponse(message);
    }

    private String buildMessage(String nickname, Optional<ExamSchedule> selectedExam,
                                 LocalDate today, LocalTime now) {
        if (selectedExam.isEmpty()) {
            return randomFrom(generalMessages(nickname, now));
        }

        ExamSchedule exam = selectedExam.get();
        long dDay = ChronoUnit.DAYS.between(today, exam.getExamDate());
        String certType = exam.getCertType().name();

        if (dDay == 0) {
            return randomFrom(examDayMessages(nickname, certType));
        } else if (dDay >= 1 && dDay <= 7) {
            return randomFrom(urgentMessages(nickname, certType, dDay));
        } else if (dDay >= 8 && dDay <= 30) {
            return randomFrom(countdownMessages(nickname, certType, dDay));
        } else {
            // dDay > 30 또는 dDay < 0(시험 종료): 일반 인사 (D-day 숫자 노출 안 함)
            return randomFrom(generalMessages(nickname, now));
        }
    }

    private List<String> examDayMessages(String nickname, String certType) {
        return List.of(
            "오늘이 바로 " + certType + " 시험 날이에요, " + nickname + "님! 💪 화이팅!",
            nickname + "님, 오늘은 " + certType + " 시험 날! 지금까지 해온 것만 믿고 달려가세요 🔥",
            "드디어 " + certType + " 시험 날! " + nickname + "님 할 수 있어요 💪",
            nickname + "님 오늘 " + certType + " 시험! 준비한 것들 믿고 침착하게 풀어내세요 ✨"
        );
    }

    private List<String> urgentMessages(String nickname, String certType, long dDay) {
        return List.of(
            certType + " D-" + dDay + ", 마지막 스퍼트! " + nickname + "님 파이팅! 🔥",
            nickname + "님, " + certType + " D-" + dDay + "! 지금이 골든타임이에요 💪",
            "D-" + dDay + "! " + nickname + "님 " + certType + " 마무리 잘 하고 계시죠? 🎯",
            certType + " D-" + dDay + "! " + nickname + "님 오늘도 한 문제씩 착착 🧠",
            nickname + "님, " + certType + " D-" + dDay + "! 오답노트 한 번 더 보고 가세요 📝"
        );
    }

    private List<String> countdownMessages(String nickname, String certType, long dDay) {
        return List.of(
            nickname + "님, " + certType + " 시험까지 " + dDay + "일 남았어요! 꾸준히 가봐요 📚",
            certType + " D-" + dDay + ", " + nickname + "님 오늘도 한 걸음씩 나아가고 있어요 🚶",
            nickname + "님! " + certType + " 시험 " + dDay + "일 전, 지금 페이스 유지가 중요해요 🎯",
            "D-" + dDay + " " + certType + " 시험! " + nickname + "님 매일 조금씩이 쌓여요 💡",
            nickname + "님, " + certType + " 시험 " + dDay + "일 남았네요. 오늘도 화이팅! ✨",
            certType + " 준비 중인 " + nickname + "님, D-" + dDay + "! 포기하지 말고 달려봐요 🏃"
        );
    }

    private List<String> generalMessages(String nickname, LocalTime now) {
        int hour = now.getHour();
        String timeGreet;
        if (hour >= 5 && hour < 11) {
            timeGreet = "좋은 아침이에요";
        } else if (hour >= 11 && hour < 17) {
            timeGreet = "좋은 오후예요";
        } else if (hour >= 17 && hour < 22) {
            timeGreet = "좋은 저녁이에요";
        } else {
            timeGreet = "늦은 시간에도 공부 중이시네요";
        }

        return List.of(
            nickname + "님, " + timeGreet + "! 오늘도 SQL 한 문제 풀어볼까요? 📚",
            timeGreet + ", " + nickname + "님! 오늘 하루도 파이팅이에요 💪",
            nickname + "님! 오늘도 꾸준하게 성장 중이시네요 ✨",
            "안녕하세요, " + nickname + "님! 오늘은 어떤 문제에 도전해볼까요? 🎯",
            nickname + "님, " + timeGreet + "! 매일 조금씩 성장하고 있어요 🚀",
            nickname + "님, 오늘도 SQL 실력 키우러 오셨군요! 반가워요 😊",
            "환영해요, " + nickname + "님! 오늘 목표를 하나씩 이뤄가봐요 🏆",
            nickname + "님, 꾸준함이 실력이 돼요. 오늘도 화이팅! 💡"
        );
    }

    private String randomFrom(List<String> pool) {
        return pool.get(java.util.concurrent.ThreadLocalRandom.current().nextInt(pool.size()));
    }
}
