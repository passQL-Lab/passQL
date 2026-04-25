-- 약관을 독립 도메인으로 관리 — AppSetting과 분리
CREATE TABLE IF NOT EXISTS legal (
    legal_uuid  UUID         NOT NULL,
    type        VARCHAR(50)  NOT NULL,
    title       VARCHAR(255) NOT NULL,
    content     TEXT         NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PUBLISHED',
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    PRIMARY KEY (legal_uuid),
    CONSTRAINT uk_legal_type UNIQUE (type)
);

INSERT INTO legal (legal_uuid, type, title, content, status, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'TERMS_OF_SERVICE',
    '이용약관',
    '## 제1조 (목적)\n본 약관은 passQL(이하 "서비스")이 제공하는 SQL 자격증 학습 서비스의 이용 조건 및 절차, 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.\n\n## 제2조 (서비스 이용)\n서비스는 소셜 로그인(Google 등)을 통해 이용할 수 있습니다. 이용자는 타인의 정보를 도용하거나 서비스 운영을 방해하는 행위를 하여서는 안 됩니다.\n\n## 제3조 (서비스 변경 및 중단)\n회사는 서비스 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다. 다만 불가피한 사유로 사전 공지가 어려운 경우 사후에 공지할 수 있습니다.\n\n## 제4조 (지식재산권)\n서비스 내 문제, 해설, AI 생성 콘텐츠 등 모든 저작물의 지식재산권은 회사에 귀속됩니다. 이용자는 서비스를 학습 목적으로만 사용할 수 있으며, 무단 복제·배포를 금지합니다.\n\n## 제5조 (면책)\n회사는 천재지변, 서비스 장애, 이용자 귀책으로 인한 손해에 대해 책임을 지지 않습니다. 서비스는 자격증 합격을 보장하지 않습니다.\n\n## 제6조 (준거법)\n본 약관은 대한민국 법률에 따라 해석되며, 분쟁 발생 시 관할 법원은 회사 소재지를 관할하는 법원으로 합니다.',
    'PUBLISHED',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'PRIVACY_POLICY',
    '개인정보처리방침',
    '## 1. 수집하는 개인정보\n소셜 로그인 시 이메일 주소, 닉네임, 프로필 사진(선택)을 수집합니다. 서비스 이용 중 문제 풀이 이력, 학습 통계 데이터가 자동으로 생성·저장됩니다.\n\n## 2. 수집 목적\n수집된 정보는 회원 식별 및 서비스 제공, 맞춤형 학습 데이터 제공, 서비스 개선 및 통계 분석 목적으로만 사용됩니다.\n\n## 3. 보유 기간\n개인정보는 회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관 후 파기합니다.\n\n## 4. 제3자 제공\n회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 법령에 의한 경우 또는 이용자가 동의한 경우는 예외로 합니다.\n\n## 5. 이용자의 권리\n이용자는 언제든지 자신의 개인정보 열람, 수정, 삭제를 요청할 수 있습니다. 계정 삭제는 설정 페이지에서 직접 처리하거나 고객센터로 요청하실 수 있습니다.\n\n## 6. 문의\n개인정보 처리에 관한 문의는 chan4760@gmail.com으로 연락해 주세요.',
    'PUBLISHED',
    NOW(),
    NOW()
)
ON CONFLICT (type) DO NOTHING;
