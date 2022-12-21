import { clsx, createElement, Fragment, FunctionComponent, Icon, MouseEvent, PropsWithChildren, Transition, UnstyledMenu } from "/editor/deps.ts";
import "./Menu.css";

export const Button: FunctionComponent<PropsWithChildren> = ({ children }) => {
	return (
		<UnstyledMenu.Button as={Fragment}>
			{children}
		</UnstyledMenu.Button>
	);
};

export const Menu: FunctionComponent<PropsWithChildren> = ({ children }) => {
	return (
		<UnstyledMenu>
			<div className="menu">
				{children}
			</div>
		</UnstyledMenu>
	);
};

export type ItemsProps = {
	placement?: "left" | "right";
};

export const Items: FunctionComponent<PropsWithChildren<ItemsProps>> = ({ children, ...props }) => {
	return (
		<Transition
			as={Fragment}
			enter="menu__items--enter"
			enterFrom="menu__items--enterFrom"
			enterTo="menu__items--enterTo"
			leave="menu__items--leave"
			leaveFrom="menu__items--leaveFrom"
			leaveTo="menu__items--leaveTo"
		>
			<UnstyledMenu.Items as={Fragment}>
				<ul className={clsx("menu__items", props.placement === "right" ? "menu__items--right" : "menu__items--left")}>
					{children}
				</ul>
			</UnstyledMenu.Items>
		</Transition>
	);
};

export type ItemProps = {
	label: string;
	icon?: string;
	keybind?: string;
	onAction?: (e: MouseEvent<HTMLLIElement>) => void;
};

export const Item: FunctionComponent<PropsWithChildren<ItemProps>> = ({ children, ...props }) => {
	return (
		<UnstyledMenu.Item>
			{({ active }) => (
				<li className={clsx("menu__item", active && "menu__item--active")} onClick={props.onAction}>
					<div className="menu__item-icon">
						{props.icon &&
							<Icon path={props.icon} size={0.5} />}
					</div>
					<div className="menu__item-label">
						{props.label}
					</div>
					<div className="menu__item-keybind">{props.keybind}</div>
				</li>
			)}
		</UnstyledMenu.Item>
	);
};

export const Separator: FunctionComponent = () => {
	return <li className="menu__separator"></li>;
};
