import { createElement, FunctionComponent, HTMLAttributes, PropsWithChildren } from "/editor/deps.ts";
import "./ButtonGroup.css";

export const ButtonGroup: FunctionComponent<PropsWithChildren<HTMLAttributes<HTMLDivElement>>> = ({ children, ...props }) => {
	return <div {...props} className={`btn-group ${props.className ?? ""}`}>{children}</div>;
};
