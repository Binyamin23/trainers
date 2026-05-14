import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  // if (module.hot) {
  //   module.hot.accept("./App", () => {
  //     const ReactApp = require("./App").default;
  //     root.render(
  //       <BrowserRouter>
  //         <ReactApp />
  //       </BrowserRouter>
  //     );
  //   });
  // }
} else {
  console.error("Root element not found");
}
