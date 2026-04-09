import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import CategoryCards from "./pages/CategoryCards";
import PracticeSet from "./pages/PracticeSet";
import PracticeResult from "./pages/PracticeResult";
import QuestionDetail from "./pages/QuestionDetail";
import AnswerFeedback from "./pages/AnswerFeedback";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import { ensureRegistered } from "./stores/memberStore";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "questions", element: <CategoryCards /> },
      { path: "questions/:questionUuid", element: <QuestionDetail /> },
      { path: "stats", element: <Stats /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "questions/:questionUuid/result",
    element: <AnswerFeedback />,
  },
  {
    path: "practice/:sessionId/:index",
    element: <PracticeSet />,
  },
  {
    path: "practice/:sessionId/result",
    element: <PracticeResult />,
  },
]);

export default function App() {
  useEffect(() => {
    ensureRegistered();
  }, []);

  return <RouterProvider router={router} />;
}
