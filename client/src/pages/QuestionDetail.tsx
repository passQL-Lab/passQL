import { useParams } from "react-router-dom";

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  return <div className="p-4">Question #{id}</div>;
}
