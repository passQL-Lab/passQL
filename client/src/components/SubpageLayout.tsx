import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface SubpageLayoutProps {
  readonly title: string;
  readonly children: ReactNode;
  /** 콘텐츠 영역 추가 클래스 (예: "space-y-3") */
  readonly contentClassName?: string;
  /**
   * 채팅형 레이아웃 전용 — true 시 페이지 전체가 h-screen flex-col으로 전환.
   * 콘텐츠 영역이 flex-1 overflow-hidden flex flex-col p-0 으로 설정된다.
   * contentClassName 은 이 경우에도 추가 클래스로 병합된다.
   */
  readonly fullHeight?: boolean;
}

/**
 * 탭바 없는 서브페이지 공통 레이아웃
 * - ArrowLeft 뒤로가기 헤더 + 콘텐츠 영역
 * - AppLayout 밖 독립 라우트 전용 (DevPage, SettingsFeedback 등)
 * - fullHeight=true: 채팅형 전체 화면 레이아웃 (h-screen, 하단 고정 입력 지원)
 */
export default function SubpageLayout({
  title,
  children,
  contentClassName,
  fullHeight = false,
}: SubpageLayoutProps) {
  const navigate = useNavigate();

  const outerClass = fullHeight
    ? "h-screen flex flex-col overflow-hidden bg-surface"
    : "min-h-screen bg-surface";

  const contentClass = fullHeight
    ? `flex-1 overflow-hidden flex flex-col${contentClassName ? ` ${contentClassName}` : ""}`
    : `py-6 px-4${contentClassName ? ` ${contentClassName}` : ""}`;

  return (
    <div className={outerClass}>
      {/* 헤더 */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-border bg-surface-card">
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-text-primary">{title}</h1>
      </div>

      {/* 콘텐츠 */}
      <div className={contentClass}>{children}</div>
    </div>
  );
}
