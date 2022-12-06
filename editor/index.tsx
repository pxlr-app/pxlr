import { render } from "/editor/deps.ts";
import App from "./App.tsx";
import "https://esm.sh/@fortawesome/fontawesome-svg-core@6.2.1/styles.css";

render(App(), document.getElementById("root")!);
