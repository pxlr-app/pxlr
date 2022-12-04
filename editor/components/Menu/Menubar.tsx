import { Fragment, FunctionComponent, h, Ref } from "/editor/deps.ts";
import { UnstyledMenu, UnstyledMenuItem, UnstyledMenuItemProps } from "./UnstyledMenu.tsx";
import { Anchor, Constraints, HorizontalAlign, VerticalAlign } from "../Anchor/mod.ts";

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
								<Anchor
									constraints={anchorConstraints}
									class="menubar-item__anchor"
								>
									{props.children}
								</Anchor>
							)}
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
