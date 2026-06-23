import { useState } from "react";
import { DispatchPage } from "./pages/DispatchPage";
import { NewMissionPage } from "./pages/NewMissionPage";
import type { MissionPrefill } from "./types";

type Page = "dispatch" | "new-mission";

function App() {
  const [page, setPage] = useState<Page>("dispatch");
  const [prefill, setPrefill] = useState<MissionPrefill | undefined>(undefined);

  if (page === "new-mission") {
    return <NewMissionPage onBack={() => setPage("dispatch")} initial={prefill} />;
  }

  return (
    <DispatchPage
      onNewMission={(p?: MissionPrefill) => {
        setPrefill(p);
        setPage("new-mission");
      }}
    />
  );
}

export default App;
