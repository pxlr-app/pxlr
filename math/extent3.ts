import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";

export class Extent3 {
	#buffer: NumberArray;
	constructor(buffer: NumberArray);
	constructor(x?: number, y?: number, z?: number, ctor?: NumberArrayConstructor);
	constructor(buffer_or_x: NumberArray | number = 0, y = 0, z = 0, ctor: NumberArrayConstructor = Array) {
		if (typeof buffer_or_x === "number") {
			let x = buffer_or_x;
			this.#buffer = new ctor(3);
			this.set(x, y, z);
		} else {
			this.#buffer = buffer_or_x;
		}
	}

	get buffer() {
		return this.#buffer;
	}

	get width() {
		return this.#buffer[0];
	}

	set width(value: number) {
		this.set(value, this.height, this.depth);
	}

	get height() {
		return this.#buffer[1];
	}

	set height(value: number) {
		this.set(this.width, value, this.depth);
	}

	get depth() {
		return this.#buffer[2];
	}

	set depth(value: number) {
		this.set(this.width, this.height, value);
	}

	set(width: number, height: number, depth: number) {
		this.#buffer[0] = width;
		this.#buffer[1] = height;
		this.#buffer[2] = depth;
		return this;
	}

	copy(other: ReadonlyExtent3) {
		return this.set(other.buffer[0], other.buffer[1], other.buffer[2]);
	}
}

export type ReadonlyExtent3 = Pick<Extent3, "buffer" | "width" | "height" | "depth">;
