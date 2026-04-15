import React from "react";
import ReactDOM from "react-dom/client";
import EntryPoint from "./src/entry-point";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EntryPoint />
  </React.StrictMode>
);
