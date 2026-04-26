import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
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
import SettingsFeedback from "./pages/SettingsFeedback";
import Login from "./pages/Login";
import { isAuthenticated } from "./stores/authStore";

/** 인증 필수 가드 — 미로그인 시 /login으로 redirect */
function RequireAuth() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

/** 이미 로그인된 경우 /login 접근 시 홈으로 redirect */
function RedirectIfAuth() {
  return isAuthenticated() ? <Navigate to="/" replace /> : <Outlet />;
}

const router = createBrowserRouter([
  // 로그인 페이지 — 인증 후 접근 시 홈으로 redirect
  {
    element: <RedirectIfAuth />,
    children: [
      { path: "login", element: <Login /> },
    ],
  },
  // 인증 필수 영역
  {
    element: <RequireAuth />,
    children: [
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
      // 건의사항 서브페이지 — AppLayout 밖 독립 라우트 (탭바 없는 몰입형)
      {
        path: "settings/feedback",
        element: <SettingsFeedback />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
