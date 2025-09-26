import { Extent2, Rect } from "@pxlr/math";
import { KDTree2 } from "./kdtree2.ts";

export class Cell<TData extends Extent2> extends Rect {
	#content?: TData;
	#neighbors: [Cell<TData> | null, Cell<TData> | null, Cell<TData> | null, Cell<TData> | null];

	constructor(x: number, y: number, width: number, height: number, data?: TData) {
		super(x, y, width, height);
		this.#content = data;
		this.#neighbors = [null, null, null, null];
	}

	get isEmpty() {
		return this.#content === undefined;
	}

	get content() {
		return this.#content;
	}

	get neighbors() {
		return this.#neighbors;
	}
}

export class Grid2<TData extends Extent2> extends Extent2 {
	#emptyCells: Cell<TData>[];
	#filledCells: Cell<TData>[];

	constructor(width: number, height: number) {
		super(width, height);
		const cell = new Cell<TData>(0, 0, width, height);
		this.#emptyCells = [cell];
		this.#filledCells = [];
	}

	insert(data: TData) {
		// const node = new Grid2Cell(data);
		// this.#cells[y][x] = node;

		// // Connect neighbors
		// if (x > 0) {
		// 	node.left = this.#cells[y][x - 1];
		// }
		// if (x < this.#cells[y].length - 1) {
		// 	node.right = this.#cells[y][x + 1];
		// }
		// if (y > 0) {
		// 	node.top = this.#cells[y - 1][x];
		// }
		// if (y < this.#cells.length - 1) {
		// 	node.bottom = this.#cells[y + 1][x];
		// }
	}
}
