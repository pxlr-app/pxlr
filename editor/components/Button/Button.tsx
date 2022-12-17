import { h } from "/editor/deps.ts";
import type { FunctionComponent, JSX } from "/editor/deps.ts";
import "./Button.css";

export const Button: FunctionComponent<JSX.HTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => {
	return (<button {...props} class={`btn ${props.class}`}>{children}</button>)
}