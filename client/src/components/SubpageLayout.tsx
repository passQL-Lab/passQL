import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface SubpageLayoutProps {
  readonly title: string;
  readonly children: ReactNode;
  /** 콘텐츠 영역 추가 클래스 (예: "space-y-3") */
  readonly contentClassName?: string;
}

/**
 * 탭바 없는 서브페이지 공통 레이아웃
 * - ArrowLeft 뒤로가기 헤더 + 콘텐츠 영역
 * - AppLayout 밖 독립 라우트 전용 (DevPage, SettingsFeedback 등)
 */
export default function SubpageLayout({ title, children, contentClassName }: SubpageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-surface-card">
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
      <div className={`py-6 px-4${contentClassName ? ` ${contentClassName}` : ""}`}>
        {children}
      </div>
    </div>
  );
}
