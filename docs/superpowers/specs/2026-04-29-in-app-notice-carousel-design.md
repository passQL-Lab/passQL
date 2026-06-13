# 인앱 공지 캐러셀 모달 설계

## 개요

앱 로그인 후 활성 공지가 있을 때 Bottom Sheet 스타일 캐러셀 모달로 표시한다.
관리자가 공지를 등록·활성화하면 사용자가 앱 진입 시 확인할 수 있다.
이미지 업로드는 MinIO + WebP 압축 처리(RomRom-BE 이식)를 사용한다.

---

## 1. 신규 모듈: PQL-Domain-Storage

RomRom-BE의 `RomRom-Domain-Storage`를 이식한다. FTP/SMB 관련 클래스는 제외하고 MinIO + 이미지 압축에 필요한 것만 가져온다.

### 이식 대상 파일 (패키지: `com.passql.storage.*`)

| 원본 (romrom) | 대상 (passql) | 비고 |
|---|---|---|
| `constant/UploadType.java` | 그대로 이식 | |
| `constant/MimeType.java` | 그대로 이식 | |
| `dto/CompressedImage.java` | 그대로 이식 | |
| `properties/MinioProperties.java` | 그대로 이식 | |
| `util/MinioUtil.java` | 그대로 이식 | |
| `util/FileUtil.java` | `CommonUtil.nvl` 의존성 제거, passql 방식으로 교체 |
| `service/FileService.java` | 그대로 이식 | |
| `service/MinIoFileServiceImpl.java` | 그대로 이식 | |
| `service/ImageCompressionService.java` | 그대로 이식 | |

FTP/SMB fallback(`FtpFileServiceImpl`, `SmbFileServiceImpl`, `StorageService`)은 이식하지 않는다.
passQL에서는 MinIO 단일 업로드만 사용하는 간소화된 `NoticeImageService`를 직접 작성한다.

### build.gradle

```gradle
plugins {
    id 'java-library'
    id 'org.springframework.boot'
    id 'io.spring.dependency-management'
}

bootJar { enabled = false }
jar { enabled = true; archiveClassifier = '' }

dependencies {
    api project(':PQL-Common')

    // WebP 압축
    api "com.sksamuel.scrimage:scrimage-core:4.3.5"
    api "com.sksamuel.scrimage:scrimage-webp:4.3.5"

    // MinIO
    api "io.minio:minio:8.5.17"
}
```

### settings.gradle 추가

```gradle
include 'PQL-Domain-Storage'
```

### PQL-Web/build.gradle 추가

```gradle
api project(':PQL-Domain-Storage')
```

### application.yml 추가 항목

```yaml
minio:
  endpoint: ${MINIO_ENDPOINT}
  access-key: ${MINIO_ACCESS_KEY}
  secret-key: ${MINIO_SECRET_KEY}
  bucket: ${MINIO_BUCKET}
```

### ErrorCode 추가 (PQL-Common)

```java
// Storage
INVALID_FILE_REQUEST(HttpStatus.BAD_REQUEST, "유효하지 않은 파일 요청입니다."),
FILE_UPLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다."),
```

---

## 2. Notice 엔티티 (PQL-Domain-Meta)

### 엔티티

```java
@Entity
@Table(name = "notice")
public class Notice extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID noticeUuid;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // MinIO 이미지 URL (없으면 null)
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    // 카테고리 뱃지 텍스트 (예: "신규 기능", "업데이트")
    @Column(length = 30)
    private String badge;

    // 캐러셀 표시 순서 (낮을수록 먼저)
    @Column(nullable = false)
    private int displayOrder;

    // 활성화 여부 — false면 API 응답에서 제외
    @Column(nullable = false)
    private boolean active;
}
```

### DTO

```java
// API 응답
public record NoticeResponse(
    UUID noticeUuid,
    String title,
    String content,
    String imageUrl,
    String badge,
    int displayOrder
) {}
```

### Service

- `findActiveNotices()` — `active = true`인 공지를 `displayOrder ASC`로 반환
- `create(NoticeCreateRequest)` — 공지 생성 (이미지 없으면 imageUrl = null)
- `update(UUID, NoticeUpdateRequest)` — 공지 수정
- `delete(UUID)` — 공지 삭제 (이미지 있으면 MinIO에서도 삭제)
- `toggleActive(UUID)` — 활성/비활성 토글

---

## 3. API (PQL-Web)

### 공개 API

```
GET /notices/active
```
- 인증 필요 (기존 `SecurityConfig` 따름)
- `active = true` 공지 목록 반환 (`displayOrder ASC`)
- 공지 없으면 빈 배열 반환

### 어드민 API

```
GET    /admin/notices              — 공지 목록 (Thymeleaf 뷰)
POST   /admin/notices              — 공지 생성 (multipart/form-data, 이미지 선택)
PUT    /admin/notices/{uuid}       — 공지 수정
DELETE /admin/notices/{uuid}       — 공지 삭제
PATCH  /admin/notices/{uuid}/toggle — 활성/비활성 토글
```

이미지 업로드 흐름:
1. `MultipartFile` 수신
2. `ImageCompressionService.compress()` → WebP 변환
3. `MinIoFileServiceImpl.uploadFile()` → MinIO 저장
4. 반환된 URL을 `Notice.imageUrl`에 저장

---

## 4. 프론트엔드

### localStorage 로직

```
앱 로드 (App.tsx / RequireAuth 통과 후)
→ GET /notices/active 호출
→ 공지 없음: 팝업 미표시
→ 공지 있음:
    localStorage.getItem('passql_notice_seen_id') 확인
    → 저장 값 == 공지 목록 중 createdAt이 가장 최신인 noticeUuid: 미표시
    → 다름 or 없음: NoticeCarouselModal 표시
        → 닫기: 그냥 닫음 (localStorage 미저장)
        → 다시 보지 않기: localStorage.setItem('passql_notice_seen_id', latestUuid) 후 닫음
    ※ latestUuid = API 응답에서 createdAt 기준 가장 최신 공지의 noticeUuid
```

### NoticeCarouselModal 컴포넌트

위치: `client/src/components/NoticeCarouselModal.tsx`

**구조**
- Bottom Sheet 스타일 (기존 `ConfirmModal`과 동일 패턴)
- 오버레이 클릭 시 닫기 (localStorage 미저장)
- ESC 키 닫기

**슬라이드 내부**
- 뱃지 (badge 텍스트, primary 컬러)
- 제목 (bold)
- 내용 텍스트
- 이미지 (imageUrl 있을 때만 표시, `object-fit: cover`)

**인디케이터**
- 하단 dot 배열: 활성 슬라이드는 가로로 늘어난 pill (기존 확인한 디자인 그대로)

**스와이프**
- `touchstart` / `touchend` 이벤트로 좌우 스와이프 감지
- 스와이프 threshold: 50px

**버튼**
- 중간 슬라이드: `확인` (Primary, 다음 슬라이드로 이동)
- 마지막 슬라이드: `다시 보지 않기 (좌, Secondary)` + `닫기 (우, Primary)` 가로 나란히

### API 함수 추가

위치: `client/src/api/meta.ts` (기존 파일에 추가)

```ts
export function fetchActiveNotices(): Promise<NoticeResponse[]>
```

### 타입 추가

위치: `client/src/types/api.ts`

```ts
export interface NoticeResponse {
  noticeUuid: string
  title: string
  content: string
  imageUrl: string | null
  badge: string | null
  displayOrder: number
}
```

### 공지 표시 시점

`AppLayout.tsx`에서 마운트 시 `fetchActiveNotices()` 호출 후 `NoticeCarouselModal` 렌더링.
AppLayout은 모든 인증된 라우트의 공통 레이아웃이므로 로그인 후 첫 진입 시 자연스럽게 표시된다.

---

## 5. 어드민 페이지 (Thymeleaf)

위치: `server/PQL-Web/src/main/resources/templates/admin/notices.html`

기존 `settings.html`, `exam-schedules.html` 패턴 동일하게 구성:
- 공지 목록 테이블 (제목, 뱃지, 순서, 활성여부, 생성일, 액션)
- 공지 생성 폼: 제목, 뱃지, 내용, 이미지 업로드(선택), 순서
- 활성/비활성 토글 버튼
- 삭제 버튼 (확인 다이얼로그 포함)
- 이미지 미리보기 (업로드 시 즉시 표시)

어드민 레이아웃 사이드바에 "공지 관리" 메뉴 추가.

---

## 6. 구현 범위 정리

| 레이어 | 작업 |
|---|---|
| PQL-Domain-Storage (신규) | MinIO + scrimage 이식, `NoticeImageService` 작성 |
| PQL-Common | ErrorCode 2개 추가 |
| PQL-Domain-Meta | `Notice` 엔티티, Repository, Service, DTO |
| PQL-Web (서버) | `NoticeController`, `AdminNoticeController`, Thymeleaf 템플릿 |
| PQL-Web (설정) | `application.yml` MinIO 설정, `settings.gradle` 모듈 등록 |
| Client | `NoticeCarouselModal`, API 함수, 타입, AppLayout 연동 |
