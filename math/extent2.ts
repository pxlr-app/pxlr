import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";

export class Extent2 {
	#buffer: NumberArray;

	constructor(buffer: NumberArray);
	constructor(x?: number, y?: number, ctor?: NumberArrayConstructor);
	constructor(buffer_or_x: NumberArray | number = 0, y = 0, ctor: NumberArrayConstructor = Array) {
		if (typeof buffer_or_x === "number") {
			let x = buffer_or_x;
			this.#buffer = new ctor(2);
			this.set(x, y);
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
		this.set(value, this.height);
	}

	get height() {
		return this.#buffer[1];
	}

	set height(value: number) {
		this.set(this.width, value);
	}

	set(width: number, height: number) {
		this.#buffer[0] = width;
		this.#buffer[1] = height;
		return this;
	}

	copy(other: ReadonlyExtent2) {
		return this.set(other.buffer[0], other.buffer[1]);
	}
}

export type ReadonlyExtent2 = Pick<Extent2, "buffer" | "width" | "height">;
