import { clsx, createElement, FunctionComponent, HTMLAttributes, PropsWithChildren } from "/editor/deps.ts";
import "./Button.css";

export const Button: FunctionComponent<PropsWithChildren<HTMLAttributes<HTMLButtonElement>>> = ({ children, ...props }) => {
	return <button {...props} className={clsx("btn", props.className)}>{children}</button>;
};
