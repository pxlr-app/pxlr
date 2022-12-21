import { clsx, createElement, Fragment, FunctionComponent, HTMLAttributes, PropsWithChildren } from "/editor/deps.ts";
import "./Stack.css";

export type StackProps = {
	direction?: "horizontal" | "vertical";
	items?: "start" | "middle" | "end";
	content?: "start" | "middle" | "end";
	justify?: "start" | "center" | "end" | "between" | "around";
};

export const Stack: FunctionComponent<PropsWithChildren<StackProps>> = (
	{ children, direction = "vertical", items = "start", content = "start", justify = "between", ...props },
) => {
	return (
		<div className={clsx("stack", `stack--${direction}`, `stack--items-${items}`, `stack--content-${content}`, `stack--justify-${justify}`)}>
			{children}
		</div>
	);
};
