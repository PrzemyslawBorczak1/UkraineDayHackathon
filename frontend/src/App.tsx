import { useState } from "react";
import { DispatchPage } from "./pages/DispatchPage";
import { NewMissionPage } from "./pages/NewMissionPage";
import { SummaryPage } from "./pages/SummaryPage";

type Page = "dispatch" | "new-mission" | "summary";

function App() {
  const [page, setPage] = useState<Page>("dispatch");

  if (page === "new-mission") {
    return <NewMissionPage onBack={() => setPage("dispatch")} />;
  }

  if (page === "summary") {
    return <SummaryPage onBack={() => setPage("dispatch")} />;
  }

  return (
    <DispatchPage
      onNewMission={() => setPage("new-mission")}
      onSummary={() => setPage("summary")}
    />
  );
}

export default App;
