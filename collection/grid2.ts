import { Extent2, ReadonlyRect, ReadonlyVec2, Rect, Vec2 } from "@pxlr/math";
import { KDTree2 } from "./kdtree2.ts";

class Cell2<TData extends Extent2> extends Rect {
	#content: TData | null;

	constructor(x: number, y: number, width: number, height: number, content: TData | null = null) {
		super(x, y, width, height);
		this.#content = content;
	}

	get isEmpty() {
		return this.#content === null;
	}

	get content() {
		return this.#content;
	}

	set content(value: TData | null) {
		this.#content = value;
	}
}

export class Grid2<TData extends Extent2> extends Extent2 {
	#emptyCells: Set<Cell2<TData>>;
	#tree: KDTree2<Cell2<TData>>;

	constructor(width: number, height: number) {
		super(width, height);
		this.#tree = new KDTree2<Cell2<TData>>();
		const root = new Cell2<TData>(0, 0, width, height, null);
		this.#emptyCells = new Set<Cell2<TData>>();
		this.#emptyCells.add(root);
		this.#tree.insert(root);
	}

	percetageUsed() {
		const totalArea = this.width * this.height;
		const unusedArea = Array.from(this.#emptyCells).reduce((sum, cell) => sum + (cell.isEmpty ? cell.width * cell.height : 0), 0);
		return (totalArea - unusedArea) / totalArea;
	}

	insert(data: TData) {
		for (const cell of this.#emptyCells) {
			if (cell.isEmpty) {
				if (cell.width === data.width && cell.height === data.height) {
					// Perfect fit
					cell.content = data;
					this.#emptyCells.delete(cell);
					return true;
				} else if (cell.contains(data)) {
					// Within cell, split it
					this.#tree.remove(cell);
					this.#emptyCells.delete(cell);

					const cellA = new Cell2<TData>(cell.x, cell.y, data.width, data.height, data);
					this.#tree.insert(cellA);

					const cellB = new Cell2<TData>(cell.x + data.width, cell.y, cell.width - data.width, data.height, null);
					if (cellB.width > 0 && cellB.height > 0) {
						this.#emptyCells.add(cellB);
						this.#tree.insert(cellB);
					}

					const cellC = new Cell2<TData>(cell.x, cell.y + data.height, cell.width, cell.height - data.height, null);
					if (cellC.width > 0 && cellC.height > 0) {
						this.#emptyCells.add(cellC);
						this.#tree.insert(cellC);
					}
					return true;
				} else {
					// Try to merge empty cells to fit
					const query = new Rect(cell.x, cell.y, data.width, data.height);
					const cells = Array.from(this.#tree.search(query));
					if (cells.length > 0 && cells.every((c) => c.isEmpty)) {
						for (const cell of cells) {
							this.#tree.remove(cell);
							this.#emptyCells.delete(cell);

							tmp.copy(cell).difference(query);
							if (tmp.width > 0 && tmp.height > 0) {
								const cellA = new Cell2<TData>(tmp.x, tmp.y, tmp.width, tmp.height, null);
								this.#emptyCells.add(cellA);
								this.#tree.insert(cellA);
							}
						}
						const cellA = new Cell2<TData>(query.x, query.y, query.width, query.height, data);
						this.#tree.insert(cellA);
						return true;
					}
				}
			}
		}
		return false;
	}

	remove(data: TData) {
		for (const cell of this.#tree) {
			if (cell.content === data) {
				cell.content = null;
				this.#emptyCells.add(cell);
				return true;
			}
		}
		return false;
	}

	*search(query: ReadonlyRect): IterableIterator<[data: TData, position: ReadonlyVec2]> {
		for (const cell of this.#tree.search(query)) {
			if (cell.content) {
				yield [cell.content, new Vec2(cell.x, cell.y)];
			}
		}
	}

	*[Symbol.iterator](): IterableIterator<[data: TData, position: ReadonlyVec2]> {
		for (const cell of this.#tree) {
			if (cell.content) {
				yield [cell.content, new Vec2(cell.x, cell.y)];
			}
		}
	}
}

const tmp: Rect = new Rect();
