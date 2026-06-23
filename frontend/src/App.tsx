import { useState } from "react";
import { DispatchPage } from "./pages/DispatchPage";
import { NewMissionPage } from "./pages/NewMissionPage";
import { SummaryPage } from "./pages/SummaryPage";
import type { MissionPrefill } from "./types";

type Page = "dispatch" | "new-mission" | "summary";

function App() {
  const [page, setPage] = useState<Page>("dispatch");
  const [prefill, setPrefill] = useState<MissionPrefill | undefined>(undefined);

  if (page === "new-mission") {
    return <NewMissionPage onBack={() => setPage("dispatch")} initial={prefill} />;
  }

  if (page === "summary") {
    return <SummaryPage onBack={() => setPage("dispatch")} />;
  }

  return (
    <DispatchPage
      onNewMission={(p?: MissionPrefill) => {
        setPrefill(p);
        setPage("new-mission");
      }}
      onSummary={() => setPage("summary")}
    />
  );
}

export default App;
