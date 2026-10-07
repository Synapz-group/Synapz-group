import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Showcase } from "./showcase";
import { demoAdapter } from "./showcase/demo";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Showcase adapter={demoAdapter} />
  </StrictMode>,
);
