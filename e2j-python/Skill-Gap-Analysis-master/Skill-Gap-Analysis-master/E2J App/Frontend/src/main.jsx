import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/fonts.css";
import "./styles/auth.css";
import "./styles/aspirations.css";
import { designTokens } from "./styles/designTokens";

Object.entries(designTokens).forEach(([key, value]) => {
  document.documentElement.style.setProperty(`--${key}`, value);
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
