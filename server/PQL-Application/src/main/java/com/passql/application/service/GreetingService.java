package com.passql.application.service;

import com.passql.application.constant.GreetingMessageType;
import com.passql.application.dto.GreetingResponse;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import com.passql.meta.entity.ExamSchedule;
import com.passql.meta.repository.ExamScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GreetingService {

    private static final String FALLBACK_NICKNAME = "회원";

    private final MemberRepository memberRepository;
    private final ExamScheduleRepository examScheduleRepository;

    public GreetingResponse getGreeting(UUID memberUuid) {
        Member member = (memberUuid != null)
                ? memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid).orElse(null)
                : null;

        String nickname = (member != null && StringUtils.hasText(member.getNickname()))
                ? member.getNickname()
                : FALLBACK_NICKNAME;

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 예외 케이스: 회원 없음 → GENERAL
        if (member == null) {
            return new GreetingResponse(
                    nickname,
                    randomFrom(generalMessages(now)),
                    GreetingMessageType.GENERAL
            );
        }

        Optional<ExamSchedule> selectedExam = examScheduleRepository.findFirstByIsSelectedTrue();
        if (selectedExam.isEmpty()) {
            return new GreetingResponse(
                    nickname,
                    randomFrom(generalMessages(now)),
                    GreetingMessageType.GENERAL
            );
        }

        ExamSchedule exam = selectedExam.get();
        long dDay = ChronoUnit.DAYS.between(today, exam.getExamDate());
        String certType = exam.getCertType().name();

        if (dDay == 0) {
            return new GreetingResponse(
                    nickname,
                    randomFrom(examDayMessages(certType)),
                    GreetingMessageType.EXAM_DAY
            );
        } else if (dDay >= 1 && dDay <= 3) {
            return new GreetingResponse(
                    nickname,
                    weightedPick(urgentMessages(certType, dDay), 70, generalMessages(now), 30),
                    GreetingMessageType.URGENT
            );
        } else if (dDay >= 4 && dDay <= 7) {
            return new GreetingResponse(
                    nickname,
                    weightedPick(urgentMessages(certType, dDay), 50, generalMessages(now), 50),
                    GreetingMessageType.URGENT
            );
        } else if (dDay >= 8 && dDay <= 30) {
            return new GreetingResponse(
                    nickname,
                    weightedPick(countdownMessages(certType, dDay), 40, generalMessages(now), 60),
                    GreetingMessageType.COUNTDOWN
            );
        } else {
            // dDay > 30 또는 dDay < 0 (시험 종료)
            return new GreetingResponse(
                    nickname,
                    randomFrom(generalMessages(now)),
                    GreetingMessageType.GENERAL
            );
        }
    }

    // ---------- 메시지 풀 ----------

    private List<String> examDayMessages(String certType) {
        return List.of(
                "오늘이 바로 " + certType + " 시험 날이에요, {nickname}님!\n화이팅!",
                "{nickname}님,\n오늘은 " + certType + " 시험 날! 지금까지 해온 것만 믿고 달려가세요",
                "드디어 " + certType + " 시험 날!\n{nickname}님 할 수 있어요",
                "{nickname}님 오늘 " + certType + " 시험!\n준비한 것들 믿고 침착하게 풀어내세요"
        );
    }

    private List<String> urgentMessages(String certType, long dDay) {
        return List.of(
                certType + " D-" + dDay + ", 마지막 스퍼트!\n{nickname}님 파이팅!",
                "{nickname}님,\n" + certType + " D-" + dDay + "! 지금이 골든타임이에요",
                "D-" + dDay + "! {nickname}님\n" + certType + " 마무리 잘 하고 계시죠?",
                certType + " D-" + dDay + "!\n{nickname}님 오늘도 한 문제씩 착착",
                "{nickname}님,\n" + certType + " D-" + dDay + "! 오답노트 한 번 더 보고 가세요"
        );
    }

    private List<String> countdownMessages(String certType, long dDay) {
        return List.of(
                "{nickname}님,\n" + certType + " 시험까지 " + dDay + "일 남았어요! 꾸준히 가봐요",
                certType + " D-" + dDay + ",\n{nickname}님 오늘도 한 걸음씩 나아가고 있어요",
                "{nickname}님!\n" + certType + " 시험 " + dDay + "일 전, 지금 페이스 유지가 중요해요",
                "D-" + dDay + " " + certType + " 시험!\n{nickname}님 매일 조금씩이 쌓여요",
                "{nickname}님,\n" + certType + " 시험 " + dDay + "일 남았네요. 오늘도 화이팅!",
                certType + " 준비 중인 {nickname}님,\nD-" + dDay + "! 포기하지 말고 달려봐요"
        );
    }

    private List<String> generalMessages(LocalTime now) {
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
                "{nickname}님, " + timeGreet + "!\n오늘도 SQL 한 문제 풀어볼까요?",
                timeGreet + ", {nickname}님!\n오늘 하루도 파이팅이에요",
                "{nickname}님!\n오늘도 꾸준하게 성장 중이시네요",
                "안녕하세요, {nickname}님!\n오늘은 어떤 문제에 도전해볼까요?",
                "{nickname}님, " + timeGreet + "!\n매일 조금씩 성장하고 있어요",
                "{nickname}님,\n오늘도 SQL 실력 키우러 오셨군요! 반가워요",
                "환영해요, {nickname}님!\n오늘 목표를 하나씩 이뤄가봐요",
                "{nickname}님,\n꾸준함이 실력이 돼요. 오늘도 화이팅!"
        );
    }

    // ---------- 랜덤 유틸 ----------

    private String randomFrom(List<String> pool) {
        return pool.get(ThreadLocalRandom.current().nextInt(pool.size()));
    }

    /**
     * 두 풀 중 하나를 가중치 기반으로 먼저 선택한 뒤, 해당 풀 내에서 균등 랜덤으로 메시지를 뽑는다.
     * 풀을 물리적으로 합치지 않으므로 각 풀의 크기 차이에 영향받지 않고 의도한 비율이 정확히 유지된다.
     */
    private String weightedPick(List<String> primary, int primaryWeight,
                                 List<String> fallback, int fallbackWeight) {
        int total = primaryWeight + fallbackWeight;
        int roll = ThreadLocalRandom.current().nextInt(total);
        List<String> chosen = (roll < primaryWeight) ? primary : fallback;
        return chosen.get(ThreadLocalRandom.current().nextInt(chosen.size()));
    }
}
