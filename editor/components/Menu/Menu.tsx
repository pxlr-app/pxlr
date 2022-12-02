import { h, Fragment, Ref, FunctionComponent } from "https://esm.sh/preact@10.11.0";
import { useState, useEffect, useRef, useContext } from "https://esm.sh/preact@10.11.0/hooks";
import { useSignal, effect, Signal, batch, computed } from "https://esm.sh/@preact/signals@1.1.2?deps=preact@10.11.3";
import { faCheck, faChevronRight } from "https://esm.sh/@fortawesome/free-solid-svg-icons@6.2.1";
import { FontAwesomeIcon } from "https://esm.sh/@fortawesome/react-fontawesome@0.2.0";
import { UnstyledMenu, UnstyledMenuItem, UnstyledMenuItemProps } from "./UnstyledMenu.tsx";
import { Anchor, AnchorContext, Constraints, HorizontalAlign, VerticalAlign } from "../Anchor/mod.ts";

export interface MenuProps {
	ref?: Ref<HTMLElement>;
}

export const Menu: FunctionComponent<MenuProps> = props => {
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

export const MenuItem: FunctionComponent<MenuItemProps> = props => {
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
									<FontAwesomeIcon icon={faCheck} />
								}
							</div>
							<div class="menu-item__label">
								{!props.accessKey && props.label}
								{props.accessKey && <>
										{props.label.split(props.accessKey).shift()}
										<span
											class={showAccessKey.value ? "menu-item__label--accesskey" : ""}
										>
											{props.accessKey}
										</span>
										{props.label.split(props.accessKey).slice(1).join(props.accessKey)}
									</>
			}
							</div>
							<div class="menu-item__keybind">{props.keybind}</div>
							<div class="menu-item__icon">
								{hasChildren && 
									<FontAwesomeIcon icon={faChevronRight} />
			}
							</div>
						</div>
						{hasChildren && opened.value && 
							<Anchor
								constraints={anchorConstraints}
								class="menu-item__anchor"
							>
								<NestedMenu>{props.children}</NestedMenu>
							</Anchor>
			}
					</li>
				);
			}}
		</UnstyledMenuItem>
	);
};

const NestedMenu: FunctionComponent = props => {
	const ctx = useContext(AnchorContext);
	const transform = computed(() => ctx.value.transform ?? [HorizontalAlign.LEFT, VerticalAlign.TOP])
	return (
		<div
			class={`menu-item__nested ${transform.value[1] === VerticalAlign.TOP ? "menu-item__nested--top" : ""} ${transform.value[1] === VerticalAlign.BOTTOM ? "menu-item__nested--bottom" : ""}`}
		>
			{props.children}
		</div>
	);
};

const anchorConstraints: Constraints = {
	origins: [
		{
			anchor: [HorizontalAlign.RIGHT, VerticalAlign.TOP],
			transform: [HorizontalAlign.LEFT, VerticalAlign.TOP],
		},
		{
			anchor: [HorizontalAlign.LEFT, VerticalAlign.TOP],
			transform: [HorizontalAlign.RIGHT, VerticalAlign.TOP],
		},
		{
			anchor: [HorizontalAlign.RIGHT, VerticalAlign.BOTTOM],
			transform: [HorizontalAlign.LEFT, VerticalAlign.BOTTOM],
		},
		{
			anchor: [HorizontalAlign.LEFT, VerticalAlign.BOTTOM],
			transform: [HorizontalAlign.RIGHT, VerticalAlign.BOTTOM],
		},
	],
};

export const Separator = () => {
	return (
		<li
			tabIndex={-1}
			class="menu-separator"
		/>
	);
};
