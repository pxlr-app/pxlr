import { Fragment, FunctionComponent, h, Ref, usePopper, useState } from "/editor/deps.ts";
import { PopperContext, UnstyledMenu, UnstyledMenuItem, UnstyledMenuItemProps } from "./UnstyledMenu.tsx";
import "./Menubar.css";

export interface MenubarProps {
	ref?: Ref<HTMLElement>;
}

export const Menubar: FunctionComponent<MenubarProps> = (props) => {
	return (
		<UnstyledMenu orientation="horizontal">
			{({ props: innerProps }) => (
				<nav
					{...innerProps}
					ref={props.ref}
					class="menubar"
				>
					<ul class="menubar__list">{props.children}</ul>
				</nav>
			)}
		</UnstyledMenu>
	);
};

export type MenubarItemProps = Omit<UnstyledMenuItemProps<HTMLLIElement>, "children"> & {
	/**
	 * The label of this menu item
	 */
	label: string;
};

export const MenubarItem: FunctionComponent<MenubarItemProps> = (props) => {
	return (
		<UnstyledMenuItem<HTMLLIElement>
			id={props.id}
			accessKey={props.accessKey}
			action={props.action}
		>
			{({ selected, opened, showAccessKey, props: innerProps }) => {
				const hasChildren = "children" in props;
				return (
					<li
						{...innerProps}
						class={`menubar-item ${selected.value ? "menubar-item--selected" : ""}`}
					>
						<div class="menubar-item__label">
							{!props.accessKey && props.label}
							{props.accessKey && (
								<>
									{props.label.split(props.accessKey).shift()}
									<span
										class={showAccessKey.value ? "menubar-item__label--accesskey" : ""}
									>
										{props.accessKey}
									</span>
									{props.label.split(props.accessKey).slice(1).join(props.accessKey)}
								</>
							)}
						</div>
						{hasChildren && opened.value &&
							(
								<NestedMenu>
									{props.children}
								</NestedMenu>
							)}
					</li>
				);
			}}
		</UnstyledMenuItem>
	);
};

const NestedMenu: FunctionComponent = (props) => {
	const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
	const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
	const { styles, attributes, state } = usePopper(referenceElement, popperElement, {
		placement: "bottom-start",
		modifiers: [
			{
				name: "flip",
				options: {
					fallbackPlacements: ["top-start"],
				},
			},
		],
	});
	const { placement } = state ?? {};
	return (
		<div
			ref={setReferenceElement}
			class={`menubar-item__nested`}
		>
			<div ref={setPopperElement} style={{ visibility: placement ? "visible" : "hidden", ...styles.popper }} {...attributes.popper}>
				<PopperContext.Provider value={(placement ?? "bottom-start").includes("bottom") ? "top-start" : "bottom-start"}>
					{props.children}
				</PopperContext.Provider>
			</div>
		</div>
	);
};
