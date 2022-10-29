const { abs, min, max } = Math;
const EPS = 0.1; // On a 4k monitor

export type SurfaceDeclaration<T = any> = {
	/**
	 * Unique key of this surface
	 */
	key: string;
	/**
	 * Left position
	 */
	x: number;
	/**
	 * Top position
	 */
	y: number;
	/**
	 * Width
	 */
	width: number;
	/**
	 * Height
	 */
	height: number;
	/**
	 * Props
	 */
	props: T;
};

export type Axe = "horizontal" | "vertical";

export class EdgeModel {
	public constructor(public axe: Axe, public position: number, public offset: number, public length: number) {}

	public equals(other: EdgeModel) {
		return (
			this.axe === other.axe &&
			abs(this.offset - other.offset) < 0.0001 &&
			abs(this.length - other.length) < 0.0001 &&
			abs(this.position - other.position) < 0.0001
		);
	}

	public toString() {
		return `EdgeModel (${this.axe}, ${this.position}, [${this.offset}, ${this.length}])`;
	}
}

export class SurfaceModel {
	public constructor(
		public key: string,
		public props: any,
		public topEdge?: LongEdgeModel,
		public rightEdge?: LongEdgeModel,
		public bottomEdge?: LongEdgeModel,
		public leftEdge?: LongEdgeModel,
	) {}

	public get left() {
		return this.leftEdge?.position ?? 0;
	}

	public get right() {
		return this.rightEdge?.position ?? 100;
	}

	public get top() {
		return this.topEdge?.position ?? 0;
	}

	public get bottom() {
		return this.bottomEdge?.position ?? 100;
	}

	public get x() {
		return this.left;
	}

	public get y() {
		return this.top;
	}

	public get width() {
		return this.right - this.left;
	}

	public get height() {
		return this.bottom - this.top;
	}

	public equals(other: SurfaceModel) {
		return this.key === other.key;
	}

	public toString() {
		return `SurfaceModel (${this.key}, ${this.x}%, ${this.y}%, ${this.width}%, ${this.height}%)`;
	}
}

export class LongEdgeModel {
	public constructor(public edges: EdgeModel[]) {
		// if (edges.length === 0) {
		// 	throw new RangeError("Expected `edges` to contain at least 1 edge.");
		// }
	}

	public get axe() {
		return this.edges[0].axe;
	}

	public get position() {
		return this.edges[0].position;
	}

	public set position(value) {
		for (const edge of this.edges) {
			edge.position = value;
		}
	}

	public get offset() {
		return this.edges.reduce((offset, edge) => min(offset, edge.offset), Number.MAX_VALUE);
	}

	public get length() {
		const right = this.edges.reduce((right, edge) => max(right, edge.offset + edge.length), 0);
		return right - this.offset;
	}

	public equals(other: LongEdgeModel) {
		return (
			this.edges.length === other.edges.length &&
			this.edges.filter((b, i) => !other.edges[i].equals(b)).length === 0
		);
	}

	public toString() {
		return `LongEdgeModel (${this.axe}, ${this.position}, [${this.offset}, ${this.length}])`;
	}
}

export class CrossModel {
	public constructor(
		public top: EdgeModel | undefined,
		public right: EdgeModel | undefined,
		public bottom: EdgeModel | undefined,
		public left: EdgeModel | undefined,
	) {}

	public get x() {
		return (
			this.top?.position ??
			this.bottom?.position ??
			this.right?.offset ??
			(this.left ? this.left.offset + this.left.length : Number.NEGATIVE_INFINITY)
		);
	}

	public set x(value) {
		if (this.top) {
			this.top.position = value;
		}
		if (this.right) {
			const t = this.right.offset + this.right.length;
			this.right.offset = value;
			this.right.length = t - value;
		}
		if (this.bottom) {
			this.bottom.position = value;
		}
		if (this.left) {
			this.left.length = value - this.left.offset;
		}
	}

	public get y() {
		return (
			this.left?.position ??
			this.right?.position ??
			this.bottom?.offset ??
			(this.top ? this.top.offset + this.top.length : Number.NEGATIVE_INFINITY)
		);
	}

	public set y(value) {
		if (this.top) {
			this.top.length = value - this.top.offset;
		}
		if (this.right) {
			this.right.position = value;
		}
		if (this.bottom) {
			const t = this.bottom.offset + this.bottom.length;
			this.bottom.offset = value;
			this.bottom.length = t - value;
		}
		if (this.left) {
			this.left.position = value;
		}
	}

	public equals(other: CrossModel) {
		return (
			this.top &&
			other.top &&
			this.top.equals(other.top) &&
			this.right &&
			other.right &&
			this.right.equals(other.right) &&
			this.bottom &&
			other.bottom &&
			this.bottom.equals(other.bottom) &&
			this.left &&
			other.left &&
			this.left.equals(other.left)
		);
	}

	public toString() {
		return `Cross (${this.x}, ${this.y})`;
	}
}

export type SurfaceModels = [SurfaceModel[], EdgeModel[], LongEdgeModel[], CrossModel[]];

function segmentIntersect(x1: number, x2: number, y1: number, y2: number): boolean {
	return x2 > y1 && y2 > x1;
}

export function buildModelsFromDeclarations(surfaceDeclarations: SurfaceDeclaration[]): SurfaceModels {
	const surfaces: SurfaceModel[] = [];
	const edges: EdgeModel[] = [];
	const longEdges: LongEdgeModel[] = [];
	const crosses: CrossModel[] = [];

	// Retrieve axe splits
	const axeSplits = new Map<string, Set<number>>();
	for (const decl of surfaceDeclarations) {
		let key = "";
		// Top
		if (((key = "h" + decl.y.toFixed(2)), !axeSplits.has(key))) {
			axeSplits.set(key, new Set([decl.x, decl.x + decl.width]));
		} else {
			axeSplits
				.get(key)!
				.add(decl.x)
				.add(decl.x + decl.width);
		}
		// Right
		if (((key = "v" + (decl.x + decl.width).toFixed(2)), !axeSplits.has(key))) {
			axeSplits.set(key, new Set([decl.y, decl.y + decl.height]));
		} else {
			axeSplits
				.get(key)!
				.add(decl.y)
				.add(decl.y + decl.height);
		}
		// Bottom
		if (((key = "h" + (decl.y + decl.height).toFixed(2)), !axeSplits.has(key))) {
			axeSplits.set(key, new Set([decl.x, decl.x + decl.width]));
		} else {
			axeSplits
				.get(key)!
				.add(decl.x)
				.add(decl.x + decl.width);
		}
		// Right
		if (((key = "v" + decl.x.toFixed(2)), !axeSplits.has(key))) {
			axeSplits.set(key, new Set([decl.y, decl.y + decl.height]));
		} else {
			axeSplits
				.get(key)!
				.add(decl.y)
				.add(decl.y + decl.height);
		}
	}

	// Build EdgeModels and LongEdgeModels from the splits
	for (const [key, set] of axeSplits) {
		const splits = Array.from(set).sort((a, b) => a - b);
		const tmp: EdgeModel[] = [];
		for (let i = 1, l = splits.length; i < l; ++i) {
			const position = parseFloat(key.substr(1));
			if (position > 0 && position < 100) {
				const edge = new EdgeModel(
					key[0] === "v" ? "vertical" : "horizontal",
					position,
					splits[i - 1],
					splits[i] - splits[i - 1],
				);
				tmp.push(edge);
			}
		}
		if (tmp.length) {
			longEdges.push(new LongEdgeModel(tmp));
			edges.push(...tmp);
		}
	}

	// Build SurfaceModels from the declarations and edges
	for (const decl of surfaceDeclarations) {
		const topEdge = new LongEdgeModel([]);
		const rightEdge = new LongEdgeModel([]);
		const bottomEdge = new LongEdgeModel([]);
		const leftEdge = new LongEdgeModel([]);

		// Top
		for (const edge of edges) {
			if (
				edge.axe === "horizontal" &&
				edge.position === decl.y &&
				segmentIntersect(edge.offset, edge.offset + edge.length, decl.x, decl.x + decl.width)
			) {
				topEdge.edges.push(edge);
			}
		}
		// Right
		for (const edge of edges) {
			if (
				edge.axe === "vertical" &&
				edge.position === decl.x + decl.width &&
				segmentIntersect(edge.offset, edge.offset + edge.length, decl.y, decl.y + decl.height)
			) {
				rightEdge.edges.push(edge);
			}
		}
		// Bottom
		for (const edge of edges) {
			if (
				edge.axe === "horizontal" &&
				edge.position === decl.y + decl.height &&
				segmentIntersect(edge.offset, edge.offset + edge.length, decl.x, decl.x + decl.width)
			) {
				bottomEdge.edges.push(edge);
			}
		}
		// Left
		for (const edge of edges) {
			if (
				edge.axe === "vertical" &&
				edge.position === decl.x &&
				segmentIntersect(edge.offset, edge.offset + edge.length, decl.y, decl.y + decl.height)
			) {
				leftEdge.edges.push(edge);
			}
		}

		surfaces.push(
			new SurfaceModel(
				decl.key,
				decl.props,
				topEdge.edges.length ? topEdge : undefined,
				rightEdge.edges.length ? rightEdge : undefined,
				bottomEdge.edges.length ? bottomEdge : undefined,
				leftEdge.edges.length ? leftEdge : undefined,
			),
		);
	}

	// Build CrossModels from edges
	const crossMap: Map<
		string,
		[EdgeModel | undefined, EdgeModel | undefined, EdgeModel | undefined, EdgeModel | undefined]
	> = new Map();
	for (let i = 0, l = edges.length; i < l; ++i) {
		const edge = edges[i];
		// Left cross
		{
			const x = edge.axe === "horizontal" ? edge.offset : edge.position;
			const y = edge.axe === "horizontal" ? edge.position : edge.offset;
			const key = `${x.toFixed(4)}-${y.toFixed(4)}`;
			if (!crossMap.has(key)) {
				crossMap.set(key, [undefined, undefined, undefined, undefined]);
			}
			const cross = crossMap.get(key)!;
			cross[edge.axe === "horizontal" ? 1 : 2] = edge;
		}
		// Right cross
		{
			const x = edge.axe === "horizontal" ? edge.offset + edge.length : edge.position;
			const y = edge.axe === "horizontal" ? edge.position : edge.offset + edge.length;
			const key = `${x.toFixed(4)}-${y.toFixed(4)}`;
			if (!crossMap.has(key)) {
				crossMap.set(key, [undefined, undefined, undefined, undefined]);
			}
			const cross = crossMap.get(key)!;
			cross[edge.axe === "horizontal" ? 3 : 0] = edge;
		}
	}
	crosses.push(
		...Array.from(crossMap.values())
			.filter(([top, right, bottom, left]) => +!!top + +!!right + +!!bottom + +!!left > 2)
			.map(([top, right, bottom, left]) => new CrossModel(top, right, bottom, left)),
	);

	return [surfaces, edges, longEdges, crosses];
}

export function getEdgeDraggingBounds(edge: EdgeModel, surfaces: SurfaceModel[]) {
	const left = surfaces.find((s) =>
		edge.axe === "horizontal"
			? s.bottomEdge?.edges.includes(edge) ?? false
			: s.rightEdge?.edges.includes(edge) ?? false,
	);
	const right = surfaces.find((s) =>
		edge.axe === "horizontal"
			? s.topEdge?.edges.includes(edge) ?? false
			: s.leftEdge?.edges.includes(edge) ?? false,
	);
	if (left && !right) {
		return edge.axe === "horizontal"
			? new DOMRect(edge.offset, left.top, edge.length, left.height)
			: new DOMRect(left.left, edge.offset, left.width, edge.length);
	} else if (!left && right) {
		return edge.axe === "horizontal"
			? new DOMRect(edge.offset, right.top, edge.length, right.height)
			: new DOMRect(right.left, edge.offset, right.width, edge.length);
	} else if (left && right) {
		return edge.axe === "horizontal"
			? new DOMRect(edge.offset, left.top, edge.length, left.height + right.height)
			: new DOMRect(left.left, edge.offset, left.width + right.width, edge.length);
	} else {
		return new DOMRect();
	}
}

export function getLongEdgeDraggingBounds(edgeList: LongEdgeModel, surfaces: SurfaceModel[]) {
	let { axe, offset, length } = edgeList;
	let top = axe === "horizontal" ? -Number.MAX_VALUE : offset;
	let right = axe === "horizontal" ? offset + length : Number.MAX_VALUE;
	let bottom = axe === "horizontal" ? Number.MAX_VALUE : offset + length;
	let left = axe === "horizontal" ? offset : -Number.MAX_VALUE;

	for (const edge of edgeList.edges) {
		const bounds = getEdgeDraggingBounds(edge, surfaces);
		if (axe === "horizontal") {
			top = max(top, bounds.top);
			bottom = min(bottom, bounds.bottom);
		} else {
			right = min(right, bounds.right);
			left = max(left, bounds.left);
		}
	}

	return new DOMRect(left, top, right - left, bottom - top);
}

export function getCrossDraggingBounds(cross: CrossModel) {
	let top = cross.top?.offset ?? 0;
	let right = cross.right ? cross.right.offset + cross.right.length : 100;
	let bottom = cross.bottom ? cross.bottom.offset + cross.bottom.length : 100;
	let left = cross.left?.offset ?? 0;

	return new DOMRect(left, top, right - left, bottom - top);
}
