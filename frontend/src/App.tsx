import { useState } from "react";
import { DispatchPage } from "./pages/DispatchPage";
import { NewMissionPage } from "./pages/NewMissionPage";

type Page = "dispatch" | "new-mission";

function App() {
  const [page, setPage] = useState<Page>("dispatch");

  if (page === "new-mission") {
    return <NewMissionPage onBack={() => setPage("dispatch")} />;
  }

  return <DispatchPage onNewMission={() => setPage("new-mission")} />;
}

export default App;
