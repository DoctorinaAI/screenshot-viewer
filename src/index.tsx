/* @refresh reload */
import { render } from "solid-js/web";
import { AppRouter } from "@/app/router";
import { initTheme } from "@/shared/lib/theme";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

render(() => {
  initTheme();
  return <AppRouter />;
}, root);
