import { h, createContext, FunctionComponent } from "https://esm.sh/preact@10.11.3";
import { useRef, useEffect } from "https://esm.sh/preact@10.11.3/hooks";
import { useSignal, effect, Signal, signal } from "https://esm.sh/@preact/signals@1.1.2?deps=preact@10.11.3";

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

export interface Constraints {
	element?: HTMLElement | (() => HTMLElement);
	origins: Array<{ anchor: Alignement; transform: Alignement }>;
}

const defaultAlignment: {
	anchor: Alignement;
	transform: Alignement;
} = { anchor: [HorizontalAlign.CENTER, VerticalAlign.MIDDLE], transform: [HorizontalAlign.CENTER, VerticalAlign.MIDDLE] };

export const AnchorContext = createContext<
	Signal<{
		anchor: Alignement;
		transform: Alignement;
	}>>(signal(defaultAlignment));

export type AnchorProps =
	| {
		anchorOrigin: Alignement;
		transformOrigin: Alignement;
		class?: string;
	}
	| {
		constraints: Constraints;
		class?: string;
	};

export const Anchor: FunctionComponent<AnchorProps> = props => {
	const anchor = useRef<HTMLDivElement>(null);
	const transform = useRef<HTMLDivElement>(null);
	const alignment = useSignal<{
		anchor: Alignement;
		transform: Alignement;
	}
	>({ anchor: [HorizontalAlign.CENTER, VerticalAlign.MIDDLE], transform: [HorizontalAlign.CENTER, VerticalAlign.MIDDLE] });

	const recalc = () => {
		if (anchor.current != null && transform.current != null) {
			let newAnchorOrigin: Alignement | undefined;
			let newTransformOrigin: Alignement | undefined;

			if ("anchorOrigin" in props && "transformOrigin" in props) {
				newAnchorOrigin = props.anchorOrigin;
				newTransformOrigin = props.transformOrigin;
			} else if ("constraints" in props) {
				if (props.constraints.origins.length === 0) {
					throw new Error("Needs at least one constraints.origins.");
				}

				const anchorParentBounds = anchor.current.parentElement?.getBoundingClientRect() ?? new DOMRect();
				const transformBounds = transform.current.getBoundingClientRect();
				const constraintElement = props.constraints.element != null ? getOrRetrieve(props.constraints.element) : document.body.parentElement;
				const constraintsBounds = constraintElement?.getBoundingClientRect() ?? new DOMRect();

				const w = transformBounds.width;
				const h = transformBounds.height;

				const origins: Array<{
					overflow: number;
					align: { anchor: Alignement; transform: Alignement };
				}> = [];

				for (const origin of props.constraints.origins) {
					let anchorX = anchorParentBounds.left;
					if (origin.anchor[0] === HorizontalAlign.CENTER) {
						anchorX = anchorParentBounds.left + anchorParentBounds.width / 2;
					} else if (origin.anchor[0] === HorizontalAlign.RIGHT) {
						anchorX = anchorParentBounds.right;
					}
					let anchorY = anchorParentBounds.top;
					if (origin.anchor[1] === VerticalAlign.MIDDLE) {
						anchorY = anchorParentBounds.top + anchorParentBounds.height / 2;
					} else if (origin.anchor[1] === VerticalAlign.BOTTOM) {
						anchorY = anchorParentBounds.bottom;
					}
					let x = anchorX;
					if (origin.transform[0] === HorizontalAlign.CENTER) {
						x = anchorX - w / 2;
					} else if (origin.transform[0] === HorizontalAlign.RIGHT) {
						x = anchorX - w;
					}
					let y = anchorY;
					if (origin.transform[1] === VerticalAlign.MIDDLE) {
						y = anchorY - h / 2;
					} else if (origin.transform[1] === VerticalAlign.BOTTOM) {
						y = anchorY - h;
					}
					const prospectBounds = new DOMRect(x, y, w, h);
					const prospectOverlaps = rectOverlaps(constraintsBounds, prospectBounds);
					const overflowBounds = rectIntersection(constraintsBounds, prospectBounds);

					const overflow = prospectOverlaps ? (overflowBounds.width * overflowBounds.height) / (prospectBounds.width * prospectBounds.height) : 0;

					origins.push({
						overflow,
						align: origin,
					});
				}

				origins.sort((a, b) => b.overflow - a.overflow);

				newAnchorOrigin = origins[0].align.anchor;
				newTransformOrigin = origins[0].align.transform;
			}

			if (newAnchorOrigin != null && newTransformOrigin != null) {
				const align = alignment.value;
				if (
					align == null ||
					newAnchorOrigin[0] !== align.anchor[0] ||
					newAnchorOrigin[1] !== align.anchor[1] ||
					newTransformOrigin[0] !== align.transform[0] ||
					newTransformOrigin[1] !== align.transform[1]
				) {
					anchor.current.style.position = "absolute";

					if (newAnchorOrigin[0] === HorizontalAlign.LEFT) {
						anchor.current.style.left = "0";
						anchor.current.style.right = "auto";
					} else if (newAnchorOrigin[0] === HorizontalAlign.CENTER) {
						anchor.current.style.left = "50%";
						anchor.current.style.right = "auto";
					} else {
						anchor.current.style.left = "auto";
						anchor.current.style.right = "0";
					}

					if (newAnchorOrigin[1] === VerticalAlign.TOP) {
						anchor.current.style.top = "0";
						anchor.current.style.bottom = "auto";
					} else if (newAnchorOrigin[1] === VerticalAlign.MIDDLE) {
						anchor.current.style.top = "50%";
						anchor.current.style.bottom = "auto";
					} else {
						anchor.current.style.top = "auto";
						anchor.current.style.bottom = "0";
					}

					transform.current.style.position = "absolute";
					const t = ["0", "0"];

					if (newTransformOrigin[0] === HorizontalAlign.LEFT) {
						transform.current.style.left = "0";
						transform.current.style.right = "auto";
					} else if (newTransformOrigin[0] === HorizontalAlign.CENTER) {
						transform.current.style.left = "50%";
						transform.current.style.right = "auto";
						t[0] = "-50%";
					} else {
						transform.current.style.left = "auto";
						transform.current.style.right = "0";
					}

					if (newTransformOrigin[1] === VerticalAlign.TOP) {
						transform.current.style.top = "0";
						transform.current.style.bottom = "auto";
					} else if (newTransformOrigin[1] === VerticalAlign.MIDDLE) {
						transform.current.style.top = "0";
						transform.current.style.bottom = "auto";
						t[1] = "-50%";
					} else {
						transform.current.style.top = "auto";
						transform.current.style.bottom = "0";
					}
					transform.current.style.transform = `translate(${t[0]},${t[1]})`;

					alignment.value = {
						anchor: newAnchorOrigin,
						transform: newTransformOrigin,
					};
				}
			}
		}
	};

	useEffect(() => {
		globalThis.addEventListener("resize", recalc);
		return () => {
			globalThis.removeEventListener("resize", recalc);
		};
	}, []);

	effect(() => {
		recalc();
	});

	return (
		<div
			ref={anchor}
			class={props.class}
		>
			<div ref={transform}>
				<AnchorContext.Provider value={alignment}>{props.children}</AnchorContext.Provider>
			</div>
		</div>
	);
};

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
	return new DOMRect(min(left, right), min(top, bottom), max(left, right) - min(left, right), max(top, bottom) - min(top, bottom));
}
