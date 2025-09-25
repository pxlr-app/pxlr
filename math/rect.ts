import { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import { ReadonlyVec2 } from "./vec2.ts";

export class Rect {
	#buffer: NumberArray;
	constructor(buffer: NumberArray);
	constructor(x?: number, y?: number, width?: number, height?: number, ctor?: NumberArrayConstructor);
	constructor(buffer_or_x: NumberArray | number = 0, y = 0, width = 0, height = 0, ctor: NumberArrayConstructor = Array) {
		if (typeof buffer_or_x === "number") {
			let x = buffer_or_x;
			this.#buffer = new ctor(3);
			this.set(x, y, width, height);
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
		this.set(value, this.y, this.width, this.height);
	}

	get y() {
		return this.#buffer[1];
	}

	set y(value: number) {
		this.set(this.x, value, this.width, this.height);
	}

	get width() {
		return this.#buffer[2];
	}

	set width(value: number) {
		this.set(this.x, this.y, value, this.height);
	}

	get height() {
		return this.#buffer[3];
	}

	set height(value: number) {
		this.set(this.x, this.y, this.width, value);
	}

	get left() {
		return this.x;
	}

	set left(value: number) {
		this.set(value, this.y, this.width, this.height);
	}

	get right() {
		return this.x + this.width;
	}

	set right(value: number) {
		this.set(value - this.width, this.y, this.width, this.height);
	}

	get top() {
		return this.y;
	}

	set top(value: number) {
		this.set(this.x, value, this.width, this.height);
	}

	get bottom() {
		return this.y + this.height;
	}

	set bottom(value: number) {
		this.set(this.x, value - this.height, this.width, this.height);
	}

	set(x: number, y: number, width: number, height: number) {
		this.#buffer[0] = x;
		this.#buffer[1] = y;
		this.#buffer[2] = width;
		this.#buffer[3] = height;
		return this;
	}

	union(rect: Rect) {
		const x1 = Math.min(this.left, rect.left);
		const y1 = Math.min(this.top, rect.top);
		const x2 = Math.max(this.right, rect.right);
		const y2 = Math.max(this.bottom, rect.bottom);
		return this.set(x1, y1, x2 - x1, y2 - y1);
	}

	intersection(rect: Rect) {
		const x1 = Math.max(this.left, rect.left);
		const y1 = Math.max(this.top, rect.top);
		const x2 = Math.min(this.right, rect.right);
		const y2 = Math.min(this.bottom, rect.bottom);
		return this.set(x1, y1, Math.max(0, x2 - x1), Math.max(0, y2 - y1));
	}

	contains(other: ReadonlyVec2 | ReadonlyRect) {
		if (other instanceof Rect) {
			return this.left <= other.left && this.right >= other.right && this.top <= other.top && this.bottom >= other.bottom;
		} else {
			return this.left <= other.x && this.right >= other.x && this.top <= other.y && this.bottom >= other.y;
		}
	}

	overlaps(other: ReadonlyRect) {
		return this.left < other.right && this.right > other.left && this.top < other.bottom && this.bottom > other.top;
	}

	extends(point: ReadonlyVec2) {
		if (this.width === 0 && this.height === 0) {
			return this.set(point.x, point.y, 0, 0);
		}
		const x1 = Math.min(this.left, point.x);
		const y1 = Math.min(this.top, point.y);
		const x2 = Math.max(this.right, point.x);
		const y2 = Math.max(this.bottom, point.y);
		return this.set(x1, y1, x2 - x1, y2 - y1);
	}
}

export type ReadonlyRect = Pick<
	Rect,
	"buffer" | "bottom" | "contains" | "overlaps" | "height" | "left" | "right" | "top" | "width" | "x" | "y"
>;
