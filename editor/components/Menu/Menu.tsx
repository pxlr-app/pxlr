import { clsx, createElement, Fragment, FunctionComponent, Icon, PropsWithChildren, Transition, UnstyledMenu } from "/editor/deps.ts";
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
			{children}
		</UnstyledMenu>
	);
};

export const Items: FunctionComponent<PropsWithChildren> = ({ children }) => {
	return (
		<Transition
			enter="menu__items--enter"
			enterFrom="menu__items--enterFrom"
			enterTo="menu__items--enterTo"
			leave="menu__items--leave"
			leaveFrom="menu__items--leaveFrom"
			leaveTo="menu__items--leaveTo"
		>
			<UnstyledMenu.Items as={Fragment}>
				<ul className="menu__items">
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
};

export const Item: FunctionComponent<PropsWithChildren<ItemProps>> = ({ children, ...props }) => {
	return (
		<UnstyledMenu.Item>
			{({ active }) => (
				<li className={clsx("menu__item", active && "menu__item--active")}>
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
