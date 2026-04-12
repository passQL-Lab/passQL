import { createPortal } from "react-dom";
import { X } from "lucide-react";

// 팀원 정보 — Mock 데이터 (API 연동 없음)
const TEAM_NAME = "콜레라";
const TEAM_SUB = "Cold Red Rice Team";
const TEAM_MEMBERS = [
  {
    name: "홍의민",
    role: "PM · Frontend",
    githubUrl: "https://github.com/EM-H20",
    handle: "EM-H20",
    roleClass: "bg-blue-50 text-blue-600",
  },
  {
    name: "서새찬",
    role: "Backend · AI",
    githubUrl: "https://github.com/Cassiiopeia",
    handle: "Cassiiopeia",
    roleClass: "bg-purple-50 text-purple-600",
  },
] as const;

interface TeamModalProps {
  onClose: () => void;
}

export default function TeamModal({ onClose }: TeamModalProps) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        {/* 헤더 — 팀명 + 서브 오른쪽 정렬 */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-caption text-text-secondary mb-0.5">Made by</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-h2 text-text-primary">{TEAM_NAME}</h2>
              <span className="text-caption text-text-secondary">{TEAM_SUB}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-100 text-text-caption transition-colors"
            aria-label="닫기"
          >
            <X size={14} />
          </button>
        </div>

        {/* 팀원 목록 */}
        <ul className="flex flex-col gap-3">
          {TEAM_MEMBERS.map((member) => (
            <li
              key={member.name}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface"
            >
              <div className="flex flex-col gap-1">
                <span className="text-body font-semibold text-text-primary">
                  {member.name}
                </span>
                {/* GitHub 링크 — 새 탭으로 열기 */}
                <a
                  href={member.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-caption text-text-secondary hover:text-brand transition-colors"
                >
                  @{member.handle}
                </a>
              </div>
              <span className={`text-caption font-medium px-2.5 py-1 rounded-full ${member.roleClass}`}>
                {member.role}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
}
