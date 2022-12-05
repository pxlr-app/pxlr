import { computed, faCheck, faChevronRight, FontAwesomeIcon, Fragment, h, useContext, usePopper, useState } from "/editor/deps.ts";
import type { FunctionComponent, Ref } from "/editor/deps.ts";
import { PopperContext, UnstyledMenu, UnstyledMenuItem, UnstyledMenuItemProps } from "./UnstyledMenu.tsx";
import "./Menu.css";

export interface MenuProps {
	ref?: Ref<HTMLElement>;
}

export const Menu: FunctionComponent<MenuProps> = (props) => {
	return (
		<UnstyledMenu orientation="vertical">
			{({ props: innerProps }) => (
				<nav
					{...innerProps}
					ref={props.ref}
					class="menu"
				>
					<div class="menu__wrapper">
						<ul class="menu__list">{props.children}</ul>
					</div>
				</nav>
			)}
		</UnstyledMenu>
	);
};

export type MenuItemProps = Omit<UnstyledMenuItemProps<HTMLLIElement>, "children"> & {
	/**
	 * The label of this menu item
	 */
	label: string;
	/**
	 * The keybind to be displayed
	 */
	keybind?: string;
	/**
	 * Indicate if this menu item is checked
	 */
	checked?: boolean;
};

export const MenuItem: FunctionComponent<MenuItemProps> = (props) => {
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
						class={`menu-item ${selected.value ? "menu-item--selected" : ""}`}
					>
						<div class="menu-item__wrapper">
							<div class="menu-item__icon">
								{props.checked &&
									<FontAwesomeIcon icon={faCheck} />}
							</div>
							<div class="menu-item__label">
								{!props.accessKey && props.label}
								{props.accessKey && (
									<>
										{props.label.split(props.accessKey).shift()}
										<span
											class={showAccessKey.value ? "menu-item__label--accesskey" : ""}
										>
											{props.accessKey}
										</span>
										{props.label.split(props.accessKey).slice(1).join(props.accessKey)}
									</>
								)}
							</div>
							<div class="menu-item__keybind">{props.keybind}</div>
							<div class="menu-item__icon">
								{hasChildren &&
									<FontAwesomeIcon icon={faChevronRight} />}
							</div>
						</div>
						{hasChildren && opened.value &&
							<NestedMenu>{props.children}</NestedMenu>}
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

export const Separator = () => {
	return (
		<li
			tabIndex={-1}
			class="menu-separator"
		/>
	);
};
