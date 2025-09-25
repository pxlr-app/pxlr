import { NumberArrayConstructor, ReadonlyRect, ReadonlyVec2, Rect } from "@pxlr/math";

enum KDSplitAxis {
	X = 0,
	Y = 1,
}

export class KDNode<TData = unknown> extends Rect {
	#data: TData;
	#left: KDNode<TData> | null;
	#right: KDNode<TData> | null;
	#axis: KDSplitAxis;

	constructor(x: number, y: number, width: number, height: number, data: TData, ctor: NumberArrayConstructor = Array) {
		super(x, y, width, height, ctor);
		this.#data = data;
		this.#left = null;
		this.#right = null;
		this.#axis = KDSplitAxis.X;
	}

	get data() {
		return this.#data;
	}

	insert(node: KDNode<TData>) {
		const compareValue = this.#axis === KDSplitAxis.X ? node.x + node.width / 2 : node.y + node.height / 2;
		const thisValue = this.#axis === KDSplitAxis.X ? this.x + this.width / 2 : this.y + this.height / 2;

		const childAxis = this.#axis === KDSplitAxis.X ? KDSplitAxis.Y : KDSplitAxis.X;
		node.#axis = childAxis;

		if (compareValue < thisValue) {
			if (this.#left === null) {
				this.#left = node;
			} else {
				this.#left.insert(node);
			}
		} else {
			if (this.#right === null) {
				this.#right = node;
			} else {
				this.#right.insert(node);
			}
		}
	}

	*[Symbol.iterator](): IterableIterator<KDNode<TData>> {
		yield this;

		if (this.#left) {
			yield* this.#left;
		}

		if (this.#right) {
			yield* this.#right;
		}
	}

	*search(query: ReadonlyRect): IterableIterator<KDNode<TData>> {
		if (query.overlaps(this)) {
			yield this;
		}

		const thisCenter = this.#axis === KDSplitAxis.X ? this.x + this.width / 2 : this.y + this.height / 2;

		const queryMin = this.#axis === KDSplitAxis.X ? query.x : query.y;
		const queryMax = this.#axis === KDSplitAxis.X ? query.x + query.width : query.y + query.height;

		if (this.#left && queryMin < thisCenter) {
			yield* this.#left.search(query);
		}

		if (this.#right && queryMax >= thisCenter) {
			yield* this.#right.search(query);
		}
	}
}

export class KDTree<TData = unknown> extends Rect {
	#root: KDNode<TData> | null = null;

	constructor() {
		super(0, 0, 0, 0);
	}

	insert(geom: ReadonlyRect | ReadonlyVec2, data: TData) {
		const rect = geom instanceof Rect
			? new Rect(geom.x, geom.y, geom.width, geom.height)
			: new Rect(geom.x, geom.y, Number.EPSILON, Number.EPSILON);
		const node = new KDNode(rect.x, rect.y, rect.width, rect.height, data);
		if (this.#root === null) {
			this.#root = node;
		} else {
			this.#root.insert(node);
		}
		if (this.width === 0 && this.height === 0) {
			this.set(rect.x, rect.y, rect.width, rect.height);
		} else {
			this.union(rect);
		}
	}

	*search(query: ReadonlyRect): IterableIterator<KDNode<TData>> {
		if (!this.overlaps(query)) {
			return;
		}
		if (this.#root) {
			yield* this.#root.search(query);
		}
	}

	*[Symbol.iterator](): IterableIterator<KDNode<TData>> {
		if (this.#root) {
			yield* this.#root;
		}
	}
}

export class KDLayeredTree<TData = unknown> extends Rect {
	#layers: KDTree<TData>[];

	constructor() {
		super(0, 0, 0, 0);
		this.#layers = [];
	}

	insert(geom: ReadonlyRect | ReadonlyVec2, data: TData) {
		const rect = geom instanceof Rect
			? new Rect(geom.x, geom.y, geom.width, geom.height)
			: new Rect(geom.x, geom.y, Number.EPSILON, Number.EPSILON);
		if (this.width === 0 && this.height === 0) {
			this.set(rect.x, rect.y, rect.width, rect.height);
		} else {
			this.union(rect);
		}
		let i = this.#layers.length - 1;
		for (; i >= 0; i--) {
			const layer = this.#layers[i];
			// If the layer does overlap
			if (layer.overlaps(rect)) {
				// Insert into previous layer if possible
				if (i < this.#layers.length - 1) {
					this.#layers[i + 1].insert(rect, data);
				} else {
					// Otherwise create a new layer on top
					const layer = new KDTree<TData>();
					layer.insert(rect, data);
					this.#layers.splice(i + 1, 0, layer);
				}
				return;
			}
		}

		// It fell through all layers

		if (this.#layers.length > 0) {
			// Add to bottom layer if it exists
			this.#layers[0].insert(rect, data);
		} else {
			// or create a new one
			const layer = new KDTree<TData>();
			layer.insert(rect, data);
			this.#layers.unshift(layer);
		}
	}

	*forwardSearch(query: ReadonlyRect): IterableIterator<KDNode<TData>> {
		if (!this.overlaps(query)) {
			return;
		}
		for (let i = 0, l = this.#layers.length; i < l; i++) {
			yield* this.#layers[i].search(query);
		}
	}

	*backwardSearch(query: ReadonlyRect): IterableIterator<KDNode<TData>> {
		if (!this.overlaps(query)) {
			return;
		}
		for (let i = this.#layers.length - 1; i >= 0; i--) {
			yield* this.#layers[i].search(query);
		}
	}

	*[Symbol.iterator](): IterableIterator<KDTree<TData>> {
		yield* this.#layers;
	}
}
