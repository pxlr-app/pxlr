import { ComponentChildren, createContext, createRef, h } from "https://esm.sh/preact@10.11.0";
import { useEffect } from "https://esm.sh/preact@10.11.0/hooks";
import { Signal, signal, useSignal } from "https://esm.sh/@preact/signals@1.1.2";

export enum VerticalAlign {
	TOP = "TOP",
	MIDDLE = "MIDDLE",
	BOTTOM = "BOTTOM",
}

export enum HorizontalAlign {
	LEFT = "LEFT",
	CENTER = "CENTER",
	RIGHT = "RIGHT",
}

export type Alignement = [HorizontalAlign, VerticalAlign];

export type Constraints = {
	element?: HTMLElement | (() => HTMLElement);
	origins: { anchor: Alignement; transform: Alignement }[];
};

export type AnchorContextValue = {
		anchor: Alignement;
		transform: Alignement;
	};

export const AnchorContext = createContext<Signal<AnchorContextValue>>(signal({
	anchor: [HorizontalAlign.CENTER, VerticalAlign.MIDDLE],
	transform: [HorizontalAlign.CENTER, VerticalAlign.MIDDLE],
}));

export type AnchorProps =
	| {
		children: ComponentChildren;
		anchorOrigin: Alignement;
		transformOrigin: Alignement;
		class?: string;
	}
	| {
		children: ComponentChildren;
		constraints: Constraints;
		class?: string;
	};

export function Anchor(props: AnchorProps) {
	const anchorRef = createRef<HTMLDivElement>();
	const transformRef = createRef<HTMLDivElement>();
	// const alignment = useSignal<AnchorContextValue>({
	// 	anchor: [HorizontalAlign.CENTER, VerticalAlign.MIDDLE],
	// 	transform: [HorizontalAlign.CENTER, VerticalAlign.MIDDLE],
	// });

	// function recalc() {
	// 	const anchorElem = anchorRef.current;
	// 	const transformElem = transformRef.current;
	// 	if (!anchorElem || !transformElem) {
	// 		return;
	// 	}
	// 	let newAnchorOrigin: Alignement | undefined = undefined;
	// 	let newTransformOrigin: Alignement | undefined = undefined;
	// 	if ("anchorOrigin" in props && "transformOrigin" in props) {
	// 		newAnchorOrigin = props.anchorOrigin;
	// 		newTransformOrigin = props.transformOrigin;
	// 	} else if ("constraints" in props) {
	// 		if (props.constraints.origins.length === 0) {
	// 			throw new Error("Needs at least one constraints.origins.");
	// 		}
	// 		const anchorParentBounds = anchorElem.parentElement!.getBoundingClientRect();
	// 		const transformBounds = transformElem.getBoundingClientRect();
	// 		const constraintElement = props.constraints.element ? getOrRetrieve(props.constraints.element) : document.body.parentElement!;
	// 		const constraintsBounds = constraintElement.getBoundingClientRect();

	// 		const w = transformBounds.width;
	// 		const h = transformBounds.height;

	// 		const origins: {
	// 			overflow: number;
	// 			align: { anchor: Alignement; transform: Alignement };
	// 		}[] = [];

	// 		for (const origin of props.constraints.origins) {
	// 			let anchorX = anchorParentBounds.left;
	// 			if (origin.anchor[0] === HorizontalAlign.CENTER) {
	// 				anchorX = anchorParentBounds.left + anchorParentBounds.width / 2;
	// 			} else if (origin.anchor[0] === HorizontalAlign.RIGHT) {
	// 				anchorX = anchorParentBounds.right;
	// 			}
	// 			let anchorY = anchorParentBounds.top;
	// 			if (origin.anchor[1] === VerticalAlign.MIDDLE) {
	// 				anchorY = anchorParentBounds.top + anchorParentBounds.height / 2;
	// 			} else if (origin.anchor[1] === VerticalAlign.BOTTOM) {
	// 				anchorY = anchorParentBounds.bottom;
	// 			}
	// 			let x = anchorX;
	// 			if (origin.transform[0] === HorizontalAlign.CENTER) {
	// 				x = anchorX - w / 2;
	// 			} else if (origin.transform[0] === HorizontalAlign.RIGHT) {
	// 				x = anchorX - w;
	// 			}
	// 			let y = anchorY;
	// 			if (origin.transform[1] === VerticalAlign.MIDDLE) {
	// 				y = anchorY - h / 2;
	// 			} else if (origin.transform[1] === VerticalAlign.BOTTOM) {
	// 				y = anchorY - h;
	// 			}
	// 			const prospectBounds = new DOMRect(x, y, w, h);
	// 			const prospectOverlaps = rectOverlaps(constraintsBounds, prospectBounds);
	// 			const overflowBounds = rectIntersection(constraintsBounds, prospectBounds);

	// 			const overflow = prospectOverlaps
	// 				? (overflowBounds.width * overflowBounds.height) /
	// 					(prospectBounds.width * prospectBounds.height)
	// 				: 0;

	// 			origins.push({
	// 				overflow,
	// 				align: origin,
	// 			});
	// 		}

	// 		origins.sort((a, b) => b.overflow - a.overflow);

	// 		newAnchorOrigin = origins[0].align.anchor;
	// 		newTransformOrigin = origins[0].align.transform;
	// 	}

	// 	if (newAnchorOrigin && newTransformOrigin) {
	// 		const align = alignment.value;
	// 		if (
	// 			!align ||
	// 			newAnchorOrigin[0] !== align.anchor[0] ||
	// 			newAnchorOrigin[1] !== align.anchor[1] ||
	// 			newTransformOrigin[0] !== align.transform[0] ||
	// 			newTransformOrigin[1] !== align.transform[1]
	// 		) {
	// 			anchorElem.style.position = "absolute";

	// 			if (newAnchorOrigin[0] === HorizontalAlign.LEFT) {
	// 				anchorElem.style.left = "0";
	// 				anchorElem.style.right = "auto";
	// 			} else if (newAnchorOrigin[0] === HorizontalAlign.CENTER) {
	// 				anchorElem.style.left = "50%";
	// 				anchorElem.style.right = "auto";
	// 			} else {
	// 				anchorElem.style.left = "auto";
	// 				anchorElem.style.right = "0";
	// 			}

	// 			if (newAnchorOrigin[1] === VerticalAlign.TOP) {
	// 				anchorElem.style.top = "0";
	// 				anchorElem.style.bottom = "auto";
	// 			} else if (newAnchorOrigin[1] === VerticalAlign.MIDDLE) {
	// 				anchorElem.style.top = "50%";
	// 				anchorElem.style.bottom = "auto";
	// 			} else {
	// 				anchorElem.style.top = "auto";
	// 				anchorElem.style.bottom = "0";
	// 			}

	// 			transformElem.style.position = "absolute";
	// 			const t = ["0", "0"];

	// 			if (newTransformOrigin[0] === HorizontalAlign.LEFT) {
	// 				transformElem.style.left = "0";
	// 				transformElem.style.right = "auto";
	// 			} else if (newTransformOrigin[0] === HorizontalAlign.CENTER) {
	// 				transformElem.style.left = "50%";
	// 				transformElem.style.right = "auto";
	// 				t[0] = "-50%";
	// 			} else {
	// 				transformElem.style.left = "auto";
	// 				transformElem.style.right = "0";
	// 			}

	// 			if (newTransformOrigin[1] === VerticalAlign.TOP) {
	// 				transformElem.style.top = "0";
	// 				transformElem.style.bottom = "auto";
	// 			} else if (newTransformOrigin[1] === VerticalAlign.MIDDLE) {
	// 				transformElem.style.top = "0";
	// 				transformElem.style.bottom = "auto";
	// 				t[1] = "-50%";
	// 			} else {
	// 				transformElem.style.top = "auto";
	// 				transformElem.style.bottom = "0";
	// 			}
	// 			transformElem.style.transform = `translate(${t[0]},${t[1]})`;

	// 			alignment.value = {
	// 				anchor: newAnchorOrigin,
	// 				transform: newTransformOrigin,
	// 			};
	// 		}
	// 	}
	// }

	// useEffect(() => {
	// 	recalc();
	// 	globalThis.addEventListener("resize", recalc);
	// 	return () => {
	// 		globalThis.removeEventListener("resize", recalc);
	// 	};
	// });
	return (
		<div ref={anchorRef} class={props.class}>
			<div ref={transformRef}>
				{/* <AnchorContext.Provider value={alignment}>{props.children}</AnchorContext.Provider> */}
			</div>
		</div>
	);
}

function getOrRetrieve<T>(value: T | (() => T)): T {
	return value instanceof Function ? value() : value;
}

const { max, min } = Math;

function rectOverlaps(a: DOMRect, b: DOMRect): boolean {
	return max(a.left, b.left) < min(a.right, b.right) && max(a.top, b.top) < min(a.bottom, b.bottom);
}

function rectIntersection(a: DOMRect, b: DOMRect): DOMRect {
	const left = max(a.left, b.left);
	const right = min(a.right, b.right);
	const top = max(a.top, b.top);
	const bottom = min(a.bottom, b.bottom);
	return new DOMRect(
		min(left, right),
		min(top, bottom),
		max(left, right) - min(left, right),
		max(top, bottom) - min(top, bottom),
	);
}
