/* @refresh reload */
import { render } from "solid-js/web";
import { AppRouter } from "@/app/router";
import { initLocale } from "@/shared/lib/i18n";
import { initTheme } from "@/shared/lib/theme";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

render(() => {
  initTheme();
  initLocale();
  return <AppRouter />;
}, root);
