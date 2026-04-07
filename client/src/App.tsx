import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Questions from "./pages/Questions";
import QuestionDetail from "./pages/QuestionDetail";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "questions", element: <Questions /> },
      { path: "questions/:id", element: <QuestionDetail /> },
      { path: "stats", element: <Stats /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
