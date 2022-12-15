import { h } from "/editor/deps.ts";
import type { FunctionComponent } from "/editor/deps.ts";
import "./Button.css";

export const Button: FunctionComponent<{}> = ({ children }) => {
	return (<button class="btn">{children}</button>)
}