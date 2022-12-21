import { clsx, createElement, FunctionComponent, HTMLAttributes, PropsWithChildren } from "/editor/deps.ts";
import "./Button.css";

const sizes = {
	"extra-small": "xs",
	small: "sm",
	medium: "base",
	large: "lg",
	"extra-large": "xl",
} as const;

export interface ButtonProps {
	size?: keyof typeof sizes;
}

export const Button: FunctionComponent<PropsWithChildren<HTMLAttributes<HTMLButtonElement>> & ButtonProps> = ({ children, size = "small", ...props }) => {
	return <button {...props} className={clsx(props.className, "btn", `btn-${sizes[size]}`)}>{children}</button>;
};
