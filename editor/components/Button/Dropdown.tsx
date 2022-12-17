import { h, Fragment, useSignal, useState, usePopper, useEffect, batch } from "/editor/deps.ts";
import type { FunctionComponent, ComponentChildren } from "/editor/deps.ts";
import { Button } from "./Button.tsx";
import { PopperContext, UnstyledMenu, UnstyledMenuItem } from "../Menu/UnstyledMenu.tsx";

export const Dropdown: FunctionComponent<{ label: () => ComponentChildren }> = ({ label, children }) => {
	return (
		<UnstyledMenu orientation="vertical">
			{({ props: menuProps }) => (
				<div {...menuProps}>
					<UnstyledMenuItem<HTMLDivElement> id="menu" accessKey="">
						{({ selected, opened, showAccessKey, props: itemProps }) => {
							console.log('dropdown', opened.peek());
							return (<div {...itemProps}>
								<Button>{label()}</Button>
								{opened.value && <NestedMenu>{children}</NestedMenu>}
							</div>);
						}}
					</UnstyledMenuItem>
				</div>
			)}
		</UnstyledMenu>
	);
}

const NestedMenu: FunctionComponent = (props) => {
	const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
	const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
	const { styles, attributes, state } = usePopper(referenceElement, popperElement, {
		placement: "right-start",
		modifiers: [
			{
				name: "flip",
				options: {
					fallbackPlacements: ["right-end", "left-start", "left-end"],
				},
			},
		],
	});
	const { placement } = state ?? {};
	return (
		<div
			ref={setReferenceElement}
			class={`menu-item__nested ${placement?.includes("end") ? "menu-item__nested--end" : ""}`}
		>
			<div ref={setPopperElement} style={{ visibility: placement ? "visible" : "hidden", ...styles.popper }} {...attributes.popper}>
				<PopperContext.Provider value={placement ?? "right-start"}>
					{props.children}
				</PopperContext.Provider>
			</div>
		</div>
	);
};