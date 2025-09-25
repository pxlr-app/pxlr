import { ReadonlyRect, Rect } from "@pxlr/math";

enum KDSplitAxis {
	X = 0,
	Y = 1,
}

export class KDNode<TData = unknown> {
	#rect: ReadonlyRect;
	#data: TData;
	#left: KDNode<TData> | null;
	#right: KDNode<TData> | null;
	#axis: KDSplitAxis;

	constructor(rect: ReadonlyRect, data: TData) {
		this.#rect = rect;
		this.#data = data;
		this.#left = null;
		this.#right = null;
		this.#axis = KDSplitAxis.X;
	}

	get rect() {
		return this.#rect;
	}

	get data() {
		return this.#data;
	}

	get left() {
		return this.#left;
	}

	get right() {
		return this.#right;
	}

	get axis() {
		return this.#axis;
	}

	insert(node: KDNode<TData>) {
		const compareValue = this.#axis === KDSplitAxis.X ? node.rect.x + node.rect.width / 2 : node.rect.y + node.rect.height / 2;
		const thisValue = this.#axis === KDSplitAxis.X ? this.#rect.x + this.#rect.width / 2 : this.#rect.y + this.#rect.height / 2;

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
		if (query.intersects(this.#rect)) {
			yield this;
		}

		const thisCenter = this.#axis === KDSplitAxis.X ? this.#rect.x + this.#rect.width / 2 : this.#rect.y + this.#rect.height / 2;

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
