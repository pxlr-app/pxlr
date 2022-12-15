import { h } from "/editor/deps.ts";
import type { FunctionComponent } from "/editor/deps.ts";
import "./ButtonGroup.css";

export const ButtonGroup: FunctionComponent<{}> = ({ children }) => {
	return (<div class="btn-group">{children}</div>)
}