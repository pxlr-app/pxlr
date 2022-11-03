import { h } from "https://esm.sh/preact@10.11.0";
import "./App.css";
import { Zip } from "../libzip/zip.ts";
import { Anchor, HorizontalAlign, VerticalAlign } from "./components/Anchor/Anchor.tsx";

console.log("zip", Zip);

export default function App() {
	return (
		<div>
			<h1>App</h1>
			<Anchor anchorOrigin={[HorizontalAlign.RIGHT, VerticalAlign.BOTTOM]} transformOrigin={[HorizontalAlign.LEFT, VerticalAlign.TOP]}>Bep</Anchor>
		</div>
	);
}
