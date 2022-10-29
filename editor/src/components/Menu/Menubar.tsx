import { ParentComponent, Show, useContext } from "solid-js";
import { faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Fa from "solid-fa";
import { UnstyledMenu, UnstyledMenuItem, UnstyledMenuItemProps } from "./UnstyledMenu";
import { Anchor, AnchorContext, Constraints, HorizontalAlign, VerticalAlign } from "../Anchor";
import "./Menubar.css";

export type MenubarProps = {
	ref?: HTMLElement | ((e: HTMLElement) => void);
};

export const Menubar: ParentComponent<MenubarProps> = (props) => {
	return (
		<UnstyledMenu orientation="horizontal">
			{({ props: innerProps }) => (
				<nav {...innerProps} ref={props.ref} class="menubar">
					<ul class="menubar__list">{props.children}</ul>
				</nav>
			)}
		</UnstyledMenu>
	);
};

export type MenubarItemProps = Omit<UnstyledMenuItemProps, "children"> & {
	/**
	 * The label of this menu item
	 */
	label: string;
};

export const MenubarItem: ParentComponent<MenubarItemProps> = (props) => {
	return (
		<UnstyledMenuItem id={props.id} accessKey={props.accessKey} action={props.action}>
			{({ selected, opened, showAccessKey, props: innerProps }) => {
				const hasChildren = "children" in props;
				return (
					<li
						{...innerProps}
						class="menubar-item"
						classList={{
							"menubar-item--selected": selected(),
						}}
					>
						<div class="menubar-item__label">
							<Show when={props.accessKey} fallback={props.label}>
								<>
									{props.label.split(props.accessKey).shift()}
									<span
										classList={{
											"menubar-item__label--accesskey": showAccessKey(),
										}}
									>
										{props.accessKey}
									</span>
									{props.label.split(props.accessKey).slice(1).join(props.accessKey)}
								</>
							</Show>
						</div>
						<Show when={hasChildren && opened()}>
							<Anchor constraints={anchorConstraints} class="menubar-item__anchor">
								{props.children}
							</Anchor>
						</Show>
					</li>
				);
			}}
		</UnstyledMenuItem>
	);
};

const anchorConstraints: Constraints = {
	origins: [
		{
			anchor: [HorizontalAlign.LEFT, VerticalAlign.BOTTOM],
			transform: [HorizontalAlign.LEFT, VerticalAlign.TOP],
		},
		{
			anchor: [HorizontalAlign.LEFT, VerticalAlign.TOP],
			transform: [HorizontalAlign.LEFT, VerticalAlign.BOTTOM],
		},
		{
			anchor: [HorizontalAlign.RIGHT, VerticalAlign.BOTTOM],
			transform: [HorizontalAlign.RIGHT, VerticalAlign.TOP],
		},
		{
			anchor: [HorizontalAlign.RIGHT, VerticalAlign.TOP],
			transform: [HorizontalAlign.RIGHT, VerticalAlign.BOTTOM],
		},
	],
};
