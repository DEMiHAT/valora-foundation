import { writeFile } from "node:fs/promises";
import { events } from "../src/data/events";
await writeFile(
  "apps-script/events.json",
  JSON.stringify(events, null, 2) + "\n"
);
console.log("Exported editable event seed.");
