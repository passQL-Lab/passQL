import { useState } from "react";

const DEV_MODE_KEY = "devMode";

export function useDevMode() {
  const [enabled, setEnabled] = useState(
    () => sessionStorage.getItem(DEV_MODE_KEY) === "1"
  );

  const toggle = () => {
    const next = !enabled;
    // sessionStorage에 저장해 페이지 이동 시에도 유지하되, 탭 닫으면 초기화
    if (next) sessionStorage.setItem(DEV_MODE_KEY, "1");
    else sessionStorage.removeItem(DEV_MODE_KEY);
    setEnabled(next);
  };

  return { enabled, toggle };
}

/** React 외부(순수 함수)에서 활성화 여부 확인용 */
export function isDevModeEnabled(): boolean {
  return sessionStorage.getItem(DEV_MODE_KEY) === "1";
}
