import { batch, createContext, createEffect, JSX, onCleanup } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import {
	Axe,
	buildModelsFromDeclarations,
	CrossModel,
	EdgeModel,
	getCrossDraggingBounds,
	getEdgeDraggingBounds,
	getLongEdgeDraggingBounds,
	LongEdgeModel,
	SurfaceDeclaration,
	SurfaceModel,
	SurfaceModels,
} from "./SubdividableSurfaceModel";

export interface SubdividableSurfaceContextData {}

const SubdividableSurfaceContext = createContext<SubdividableSurfaceContextData | undefined>(undefined);

export type SubdividableSurfaceState<T = any> = Array<SurfaceDeclaration<T>>;

export interface UnstyledSubdividableSurfaceData<T = any> {
	surfaces: {
		[key: string]: {
			data: {
				key: string;
				x: number;
				y: number;
				width: number;
				height: number;
				props: T;
				hasNeighbors: [boolean, boolean, boolean, boolean];
			};
			props: {
				style: JSX.CSSProperties;
			};
		};
	};
	edges: Array<{
		data: {
			axe: Axe;
			position: number;
			offset: number;
			length: number;
		};
		props: {
			style: JSX.CSSProperties;
			onPointerDown: (e: PointerEvent) => void;
		};
	}>;
	longEdges: Array<{
		data: {
			axe: Axe;
			position: number;
			offset: number;
			length: number;
		};
		props: {};
	}>;
	crosses: Array<{
		data: {
			x: number;
			y: number;
		};
		props: {
			style: JSX.CSSProperties;
			onPointerDown: (e: PointerEvent) => void;
		};
	}>;
	props: {
		ref: (e: HTMLElement) => void;
	};
}

export interface UnstyledSubdividableSurfaceProps<T = any> {
	/**
	 * Surface state
	 */
	state?: SubdividableSurfaceState<T>;

	/**
	 * Update event when state changes
	 */
	onChange?: (state: SubdividableSurfaceState<T>) => void;

	/**
	 * Render child
	 */
	children: (menu: UnstyledSubdividableSurfaceData) => JSX.Element;
}

// https://github.com/pxlr-app/pxlr.app/blob/e5bad8060182f482392ad811c06d9ea92b8fb23f/app2/client/Layout.svelte
// https://github.com/pxlr-app/pxlr.app/blob/e5bad8060182f482392ad811c06d9ea92b8fb23f/app2/client/helpers/Layout.ts
export function UnstyledSubdividableSurface(props: UnstyledSubdividableSurfaceProps) {
	const context: () => SubdividableSurfaceContextData = () => ({});

	let surfaceRef: HTMLElement | undefined;
	let models: SurfaceModels | undefined;
	let dragging = false;
	let dragBounds = new DOMRect();
	let dragObject: EdgeModel | LongEdgeModel | CrossModel | undefined;

	const [state, setState] = createStore<UnstyledSubdividableSurfaceData>({
		surfaces: {},
		edges: [],
		longEdges: [],
		crosses: [],
		props: {
			ref(e: HTMLElement) {
				surfaceRef = e;
			},
		},
	});

	const onLeave = () => {
		if (dragging) {
			dragging = false;
			dragObject = undefined;
		}
	};
	const onMove = (e: PointerEvent) => {
		if (dragging && models != null && surfaceRef != null) {
			const bounds = surfaceRef.getBoundingClientRect();
			const [x, y] = [e.clientX - bounds.x, e.clientY - bounds.y];
			const [pX, pY] = [(x / bounds.width) * 100, (y / bounds.height) * 100];
			const [cX, cY] = [
				Math.round(Math.max(Math.min(pX, dragBounds.right), dragBounds.left) * 100) / 100,
				Math.round(Math.max(Math.min(pY, dragBounds.bottom), dragBounds.top) * 100) / 100,
			];
			if (dragObject instanceof EdgeModel) {
				dragObject.position = dragObject.axe === "horizontal" ? cY : cX;
			} else if (dragObject instanceof LongEdgeModel) {
				dragObject.position = dragObject.axe === "horizontal" ? cY : cX;
			} else if (dragObject instanceof CrossModel) {
				dragObject.x = cX;
				dragObject.y = cY;
			}
			syncStateFromModels();
		}
	};
	const syncStateFromModels = () => {
		if (models != null) {
			const [surfaces, edges, longEdges, crosses] = models;
			console.log(surfaces.map(s => s.toString()).join(", "));
			console.log(edges.map(s => s.toString()).join(", "));
			console.log(longEdges.map(s => s.toString()).join(", "));
			console.log(crosses.map(s => s.toString()).join(", "));
			batch(() => {
				for (const model of surfaces) {
					setState(
						"surfaces",
						model.key,
						reconcile({
							data: {
								key: model.key,
								x: model.x,
								y: model.y,
								width: model.width,
								height: model.height,
								hasNeighbors: [!(model.topEdge == null), !(model.rightEdge == null), !(model.bottomEdge == null), !(model.leftEdge == null)],
								props: model.props,
							},
							props: {
								style: {
									top: model.top + "%",
									right: 100 - model.right + "%",
									bottom: 100 - model.bottom + "%",
									left: model.left + "%",
								},
							},
						} as UnstyledSubdividableSurfaceData["surfaces"][""])
					);
				}
				for (let i = 0, l = edges.length; i < l; ++i) {
					const model = edges[i];
					setState(
						"edges",
						i,
						reconcile({
							data: {
								axe: model.axe,
								position: model.position,
								offset: model.offset,
								length: model.length,
							},
							props: {
								style: {
									[model.axe === "horizontal" ? "top" : "left"]: model.position + "%",
									[model.axe === "horizontal" ? "left" : "top"]: model.offset + "%",
									[model.axe === "horizontal" ? "width" : "height"]: model.length + "%",
								},
								onPointerDown(e: PointerEvent) {
									console.log("Edge.onPointerDown", e);
									dragging = true;

									const longEdge = longEdges.find(le => le.edges.includes(model));
									if (longEdge != null) {
										// CTRL break long edge?
										if (e.ctrlKey) {
											debugger;
											// dragObject = model;
											// dragBounds = getEdgeDraggingBounds(model, surfaces);
											return;
										}
										dragObject = longEdge;
										dragBounds = getLongEdgeDraggingBounds(longEdge, surfaces);
									}
								},
							},
						} as UnstyledSubdividableSurfaceData["edges"][0])
					);
				}
				for (let i = 0, l = longEdges.length; i < l; ++i) {
					const model = longEdges[i];
					setState(
						"longEdges",
						i,
						reconcile({
							data: {
								axe: model.axe,
								position: model.position,
								offset: model.offset,
								length: model.length,
							},
							props: {},
						} as UnstyledSubdividableSurfaceData["longEdges"][0])
					);
				}
				for (let i = 0, l = crosses.length; i < l; ++i) {
					const model = crosses[i];
					setState(
						"crosses",
						i,
						reconcile({
							data: {
								x: model.x,
								y: model.y,
							},
							props: {
								style: {
									left: model.x + "%",
									top: model.y + "%",
								},
								onPointerDown(e: PointerEvent) {
									console.log("Cross.onPointerDown", e);
									dragging = true;
									dragObject = model;
									dragBounds = getCrossDraggingBounds(model);
								},
							},
						} as UnstyledSubdividableSurfaceData["crosses"][0])
					);
				}
			});
		}
	};

	document.addEventListener("pointerup", onLeave);
	document.addEventListener("pointermove", onMove);
	onCleanup(() => {
		document.removeEventListener("pointerup", onLeave);
		document.removeEventListener("pointermove", onMove);
		models = undefined;
		surfaceRef = undefined;
		dragObject = undefined;
	});

	createEffect(() => {
		models = buildModelsFromDeclarations(props.state ?? []);
		syncStateFromModels();
	});

	return <SubdividableSurfaceContext.Provider value={context()}>{props.children(state)}</SubdividableSurfaceContext.Provider>;
}
