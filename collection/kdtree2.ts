import { NumberArrayConstructor, ReadonlyRect, ReadonlyVec2, Rect } from "@pxlr/math";

enum Axis {
	X = 0,
	Y = 1,
}

class Node<TData extends Rect> {
	#content: TData;
	#left: Node<TData> | null;
	#right: Node<TData> | null;
	#axis: Axis;

	constructor(data: TData, ctor: NumberArrayConstructor = Array) {
		this.#content = data;
		this.#left = null;
		this.#right = null;
		this.#axis = Axis.X;
	}

	get content() {
		return this.#content;
	}

	insert(node: Node<TData>) {
		const compareValue = this.#axis === Axis.X ? node.content.x + node.content.width / 2 : node.content.y + node.content.height / 2;
		const thisValue = this.#axis === Axis.X ? this.content.x + this.content.width / 2 : this.content.y + this.content.height / 2;

		const childAxis = this.#axis === Axis.X ? Axis.Y : Axis.X;
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

	*[Symbol.iterator](): IterableIterator<Node<TData>> {
		yield this;

		if (this.#left) {
			yield* this.#left;
		}

		if (this.#right) {
			yield* this.#right;
		}
	}

	*search(query: ReadonlyRect): IterableIterator<TData> {
		if (query.overlaps(this.content)) {
			yield this.content;
		}

		const thisCenter = this.#axis === Axis.X ? this.content.x + this.content.width / 2 : this.content.y + this.content.height / 2;

		const queryMin = this.#axis === Axis.X ? query.x : query.y;
		const queryMax = this.#axis === Axis.X ? query.x + query.width : query.y + query.height;

		if (this.#left && queryMin < thisCenter) {
			yield* this.#left.search(query);
		}

		if (this.#right && queryMax >= thisCenter) {
			yield* this.#right.search(query);
		}
	}
}

export class KDTree2<TData extends Rect> extends Rect {
	#root: Node<TData> | null = null;

	constructor() {
		super(0, 0, 0, 0);
	}

	insert(data: TData) {
		const node = new Node(data);
		if (this.#root === null) {
			this.#root = node;
		} else {
			this.#root.insert(node);
		}
		if (this.width === 0 && this.height === 0) {
			this.set(data.x, data.y, data.width, data.height);
		} else {
			this.union(data);
		}
	}

	*search(query: ReadonlyRect): IterableIterator<TData> {
		if (!this.overlaps(query)) {
			return;
		}
		if (this.#root) {
			yield* this.#root.search(query);
		}
	}

	*[Symbol.iterator](): IterableIterator<Node<TData>> {
		if (this.#root) {
			yield* this.#root;
		}
	}
}

export class KDLayeredTree2<TData extends Rect> extends Rect {
	#layers: KDTree2<TData>[];

	constructor() {
		super(0, 0, 0, 0);
		this.#layers = [];
	}

	insert(data: TData) {
		if (this.width === 0 && this.height === 0) {
			this.set(data.x, data.y, data.width, data.height);
		} else {
			this.union(data);
		}
		let i = this.#layers.length - 1;
		for (; i >= 0; i--) {
			const layer = this.#layers[i];
			// If the layer does overlap
			if (layer.overlaps(data)) {
				// Insert into previous layer if possible
				if (i < this.#layers.length - 1) {
					this.#layers[i + 1].insert(data);
				} else {
					// Otherwise create a new layer on top
					const layer = new KDTree2<TData>();
					layer.insert(data);
					this.#layers.splice(i + 1, 0, layer);
				}
				return;
			}
		}

		// It fell through all layers

		if (this.#layers.length > 0) {
			// Add to bottom layer if it exists
			this.#layers[0].insert(data);
		} else {
			// or create a new one
			const layer = new KDTree2<TData>();
			layer.insert(data);
			this.#layers.unshift(layer);
		}
	}

	*forwardSearch(query: ReadonlyRect): IterableIterator<TData> {
		if (!this.overlaps(query)) {
			return;
		}
		for (let i = 0, l = this.#layers.length; i < l; i++) {
			yield* this.#layers[i].search(query);
		}
	}

	*backwardSearch(query: ReadonlyRect): IterableIterator<TData> {
		if (!this.overlaps(query)) {
			return;
		}
		for (let i = this.#layers.length - 1; i >= 0; i--) {
			yield* this.#layers[i].search(query);
		}
	}

	*[Symbol.iterator](): IterableIterator<KDTree2<TData>> {
		yield* this.#layers;
	}
}
