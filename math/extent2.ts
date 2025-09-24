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

	get x() {
		return this.#buffer[0];
	}

	set x(value: number) {
		this.set(value, this.y);
	}

	get y() {
		return this.#buffer[1];
	}

	set y(value: number) {
		this.set(this.x, value);
	}

	set(x: number, y: number) {
		this.#buffer[0] = x;
		this.#buffer[1] = y;
		return this;
	}
}

export type ReadonlyExtent2 = Pick<
	Extent2,
	"x" | "y"
>;
