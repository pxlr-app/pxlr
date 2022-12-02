import { ComponentChildren, createContext, FunctionComponent, h, Ref } from "https://esm.sh/preact@10.11.3";
import { useContext, useEffect, useRef, useState } from "https://esm.sh/preact@10.11.3/hooks?dep=preact@10.11.3";
import { batch, computed, effect, Signal, useSignal } from "https://esm.sh/@preact/signals@1.1.2?dep=preact@10.11.3";
import { Alignement, AnchorContext, VerticalAlign } from "../Anchor/mod.ts";
import { createRef } from "https://esm.sh/v99/preact@10.11.3/src/index.d.ts";

export type Orientation = "horizontal" | "vertical";

export type NavigationDevice = "pointer" | "keyboard";

export type AutoSelectItem = "first" | "last" | "off";

export type Setter<T> = (v: T | ((prev: T) => T)) => T;

export interface MenuItemDeclaration {
	id: string;
	accessKey: string;
	action?: () => void;
}

export interface RootMenuContextData {
	showAccessKey: Signal<boolean>;
	navigationInput: Signal<NavigationDevice>;
	autoSelectItem: Signal<boolean>;
}

export interface MenuContextData {
	selected: Signal<string | undefined>;
	opened: Signal<string | undefined>;
	items: MenuItemDeclaration[];
	createMenuItem: (path: string[], item: MenuItemDeclaration) => void;
}

const RootMenuContext = createContext<RootMenuContextData | undefined>(undefined);
const MenuContext = createContext<MenuContextData | undefined>(undefined);

const PathContext = createContext<string[]>([]);

export interface UnstyledMenuData {
	showAccessKey: Signal<boolean>;
	navigationInput: Signal<NavigationDevice>;
	selected: Signal<string | undefined>;
	opened: Signal<string | undefined>;
	props: {
		tabIndex: number;
		onKeyDown: (e: KeyboardEvent) => void;
	};
}

export interface UnstyledMenuProps {
	/**
	 * The HTML Element to attach keyboard events to
	 */
	accessibilityContainer?: HTMLElement;

	/**
	 * Orientation of this menu
	 */
	orientation: Orientation;

	/**
	 * Render child
	 */
	children: (menu: UnstyledMenuData) => ComponentChildren;
}

export const UnstyledMenu = (props: UnstyledMenuProps) => {
	const path = useContext(PathContext);
	const fullpath = ("/" + path.join("/") + "/").replace(/^\/+/, "/");
	const items: MenuItemDeclaration[] = [];
	const selected = useSignal<string | undefined>(undefined);
	const opened = useSignal<string | undefined>(undefined);

	const menuContext: MenuContextData = {
		selected,
		opened,
		items,
		createMenuItem(path, item) {
			items.push(item);
		},
	};

	const rootContext = useContext(RootMenuContext) ??
		(() => {
			const showAccessKey = useSignal(false);
			const navigationInput = useSignal<NavigationDevice>("pointer");
			const autoSelectItem = useSignal(false);

			useEffect(() => {
				const onLeave = (e: MouseEvent | KeyboardEvent) => {
					batch(() => {
						rootContext.navigationInput.value = "pointer";
						rootContext.showAccessKey.value = false;
						rootContext.autoSelectItem.value = false;
					});
				};

				document.addEventListener("click", onLeave);
				document.addEventListener("keydown", onLeave);

				return () => {
					document.removeEventListener("click", onLeave);
					document.removeEventListener("keydown", onLeave);
				};
			});

			const data: RootMenuContextData = {
				showAccessKey,
				navigationInput,
				autoSelectItem,
			};

			return data;
		})();

	const anchorContext = useContext(AnchorContext);

	useEffect(() => {
		const onLeave = (e: MouseEvent | KeyboardEvent) => {
			batch(() => {
				menuContext.selected.value = undefined;
				menuContext.opened.value = undefined;
			});
		};

		document.addEventListener("click", onLeave);
		document.addEventListener("keydown", onLeave);

		return () => {
			document.removeEventListener("click", onLeave);
			document.removeEventListener("keydown", onLeave);
		};
	});

	effect(() => {
		if (rootContext.navigationInput.value === "keyboard" && rootContext.autoSelectItem.value && !menuContext.opened.value) {
			const verticalAlign = anchorContext.value.transform?.[1] ?? VerticalAlign.TOP;
			if (verticalAlign === VerticalAlign.BOTTOM) {
				menuContext.selected.value = items[items.length - 1].id;
			} else {
				menuContext.selected.value = items[0].id;
			}
		}
	});

	const data: UnstyledMenuData = {
		showAccessKey: rootContext.showAccessKey,
		navigationInput: rootContext.navigationInput,
		selected: menuContext.selected,
		opened: menuContext.opened,

		props: {
			tabIndex: 0,
			onKeyDown(e: KeyboardEvent) {
				if (e.code === "AltLeft") {
					e.preventDefault();
					e.stopImmediatePropagation();
					batch(() => {
						rootContext.showAccessKey.value = !rootContext.showAccessKey.value;
						rootContext.navigationInput.value = "keyboard";
					});
				} else if (!menuContext.opened.value) {
					const selected = menuContext.selected.value;
					let selectedIdx = items.findIndex((p) => p.id === selected);

					// Down
					if ((props.orientation === "vertical" && e.code === "ArrowDown") || (props.orientation === "horizontal" && e.code === "ArrowRight")) {
						e.preventDefault();
						e.stopImmediatePropagation();
						selectedIdx = (selectedIdx + 1) % items.length;
						batch(() => {
							rootContext.navigationInput.value = "keyboard";
							rootContext.autoSelectItem.value = false;
							menuContext.selected.value = items[selectedIdx].id;
						});
					} // Up
					else if ((props.orientation === "vertical" && e.code === "ArrowUp") || (props.orientation === "horizontal" && e.code === "ArrowLeft")) {
						e.preventDefault();
						e.stopImmediatePropagation();
						if (selectedIdx === -1) {
							selectedIdx = items.length - 1;
						} else {
							selectedIdx = (items.length + (selectedIdx - 1)) % items.length;
						}
						batch(() => {
							rootContext.navigationInput.value = "keyboard";
							rootContext.autoSelectItem.value = false;
							menuContext.selected.value = items[selectedIdx].id;
						});
					} // Forward
					else if (
						(props.orientation === "vertical" && e.code === "ArrowRight") ||
						(props.orientation === "horizontal" && e.code === "ArrowDown") ||
						e.code === "Enter"
					) {
						const selectedItem = items[selectedIdx];
						if (selectedItem.action != null) {
							selectedItem.action();
						} else {
							e.preventDefault();
							e.stopImmediatePropagation();
							batch(() => {
								rootContext.navigationInput.value = "keyboard";
								rootContext.autoSelectItem.value = true;
								menuContext.opened.value = selectedItem.id;
							});
						}
					} // AccessKey
					else if (rootContext.showAccessKey.value) {
						const accessedItem = items.find(({ id, accessKey }) => `Key${accessKey.toUpperCase()}` === e.code);
						if (accessedItem != null) {
							if (accessedItem.action != null) {
								if (document.activeElement != null) {
									(document.activeElement as HTMLElement).blur();
								}
								accessedItem.action();
							} else {
								e.preventDefault();
								e.stopImmediatePropagation();
								batch(() => {
									rootContext.navigationInput.value = "keyboard";
									rootContext.autoSelectItem.value = true;
									menuContext.selected.value = accessedItem.id;
									menuContext.opened.value = accessedItem.id;
								});
							}
						}
					}
				} // Back
				else if ((props.orientation === "vertical" && e.code === "ArrowLeft") || (props.orientation === "horizontal" && e.code === "ArrowUp")) {
					if (menuContext.opened.value) {
						e.preventDefault();
						e.stopImmediatePropagation();
						batch(() => {
							rootContext.navigationInput.value = "keyboard";
							rootContext.autoSelectItem.value = false;
							menuContext.selected.value = selected.value;
							menuContext.opened.value = undefined;
						});
					}
				}
			},
		},
	};

	return (
		<RootMenuContext.Provider value={rootContext}>
			<MenuContext.Provider value={menuContext}>{props.children(data)}</MenuContext.Provider>
		</RootMenuContext.Provider>
	);
};

export interface UnstyledMenuItemData<Item extends HTMLElement> {
	showAccessKey: Signal<boolean>;
	navigationInput: Signal<NavigationDevice>;
	selected: Signal<boolean>;
	opened: Signal<boolean>;

	props: {
		tabIndex: number;
		ref: Ref<Item>;
		onMouseEnter: (e: MouseEvent) => void;
		onClick: (e: MouseEvent) => void;
	};
}

export interface UnstyledMenuItemProps<Item extends HTMLElement> {
	/**
	 * A unique identifier for this menu item
	 */
	id: string;
	/**
	 * The access key used for accessibility navigation
	 */
	accessKey: string;
	/**
	 * The action to execute when clicking on the menu item
	 */
	action?: () => void;

	/**
	 * Render child
	 */
	children: (item: UnstyledMenuItemData<Item>) => ComponentChildren;
}

export const UnstyledMenuItem = <Item extends HTMLElement>(props: UnstyledMenuItemProps<Item>) => {
	const path = useContext(PathContext).concat([props.id]);
	const fullpath = "/" + path.join("/") + "/";

	const rootContext = useContext(RootMenuContext);
	if (rootContext == null) {
		throw new Error("UnstyledMenuItem requires a RootMenuContext somewhere in the DOM. Did you forget to wrap your component in RootMenuContext?");
	}

	const menuContext = useContext(MenuContext);
	if (menuContext == null) {
		throw new Error("UnstyledMenuItem requires a MenuContext somewhere in the DOM. Did you forget to wrap your component in MenuContext?");
	}

	menuContext.createMenuItem(path, {
		id: props.id,
		accessKey: props.accessKey,
		action: props.action,
	});

	const menuItemRef = createRef<Item>();

	effect(() => {
		const _ = menuContext.opened.value; // track change on opened
		if (menuContext.selected.value === props.id) {
			menuItemRef.current?.focus();
			setTimeout(() => menuItemRef.current?.focus(), 0); // Wait till element is visible?
		} else if (menuItemRef.current === document.activeElement) {
			menuItemRef.current?.blur();
		}
	});

	const data: UnstyledMenuItemData<Item> = {
		showAccessKey: rootContext.showAccessKey,
		navigationInput: rootContext.navigationInput,
		selected: computed(() => menuContext.selected.value === props.id),
		opened: computed(() => menuContext.opened.value === props.id),
		props: {
			tabIndex: -1,
			ref: menuItemRef,
			onMouseEnter(e) {
				batch(() => {
					rootContext.navigationInput.value = "pointer";
					menuContext.selected.value = props.id;
					if (menuContext.selected.value !== props.id) {
						menuContext.opened.value = undefined;
					}
				});
			},
			onClick(e) {
				if (e.target === e.currentTarget) {
					if (props.action != null) {
						props.action();
					} else {
						e.preventDefault();
						e.stopImmediatePropagation();
						batch(() => {
							rootContext.navigationInput.value = "pointer";
							menuContext.opened.value = props.id;
						});
					}
				}
			},
		},
	};

	return <PathContext.Provider value={path}>{props.children(data)}</PathContext.Provider>;
};
