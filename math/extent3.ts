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

	get x() {
		return this.#buffer[0];
	}

	set x(value: number) {
		this.set(value, this.y, this.z);
	}

	get y() {
		return this.#buffer[1];
	}

	set y(value: number) {
		this.set(this.x, value, this.z);
	}

	get z() {
		return this.#buffer[2];
	}

	set z(value: number) {
		this.set(this.x, this.y, value);
	}

	set(x: number, y: number, z: number) {
		this.#buffer[0] = x;
		this.#buffer[1] = y;
		this.#buffer[2] = z;
		return this;
	}
}

export type ReadonlyExtent3 = Pick<
	Extent3,
	"x" | "y" | "z"
>;
