import React from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import Storefront from "./components/Storefront";
import "./index.css";

createRoot(document.getElementById("root")).render(<React.StrictMode><AuthProvider><Storefront /></AuthProvider></React.StrictMode>);
