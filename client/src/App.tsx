import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import CategoryCards from "./pages/CategoryCards";
import DailyChallenge from "./pages/DailyChallenge";
import PracticeSet from "./pages/PracticeSet";
import PracticeResult from "./pages/PracticeResult";
import QuestionDetail from "./pages/QuestionDetail";
import AnswerFeedback from "./pages/AnswerFeedback";
import RecommendationPractice from "./pages/RecommendationPractice";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import DevPage from "./pages/DevPage";
import SettingsFeedback from "./pages/SettingsFeedback";
import { ensureRegistered } from "./stores/memberStore";

/** /dev route guard — sessionStorage에 잠금 해제 플래그가 없으면 설정 화면으로 redirect */
function DevGuard() {
  return sessionStorage.getItem("devUnlocked") ? <DevPage /> : <Navigate to="/settings" replace />;
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "questions", element: <CategoryCards /> },
      { path: "stats", element: <Stats /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  // AppLayout 밖: 전체화면 몰입형 화면 (문제 풀이는 집중 모드)
  {
    path: "questions/:questionUuid",
    element: <QuestionDetail />,
  },
  {
    path: "daily-challenge",
    element: <DailyChallenge />,
  },
  {
    path: "questions/:questionUuid/result",
    element: <AnswerFeedback />,
  },
  {
    path: "practice/:sessionId",
    element: <PracticeSet />,
  },
  {
    path: "practice/:sessionId/result",
    element: <PracticeResult />,
  },
  // 홈 추천 문제 — DailyChallenge 패턴의 단건 풀이 모드
  {
    path: "recommendation/:questionUuid",
    element: <RecommendationPractice />,
  },
  // 개발자 전용 도구 — sessionStorage 잠금 해제 확인 후에만 접근 허용
  {
    path: "dev",
    element: <DevGuard />,
  },
  // 건의사항 서브페이지 — AppLayout 밖 독립 라우트 (탭바 없는 몰입형)
  {
    path: "settings/feedback",
    element: <SettingsFeedback />,
  },
]);

export default function App() {
  useEffect(() => {
    ensureRegistered();
  }, []);

  return <RouterProvider router={router} />;
}
