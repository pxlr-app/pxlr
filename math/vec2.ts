import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import type { ReadonlyMat3 } from "./mat3.ts";

export class Vec2 {
	static ZERO: ReadonlyVec2 = new Vec2(0, 0);
	static ONE: ReadonlyVec2 = new Vec2(1, 1);
	static RIGHT: ReadonlyVec2 = new Vec2(1, 0);
	static UP: ReadonlyVec2 = new Vec2(0, 1);

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

	copy(other: ReadonlyVec2) {
		return this.set(other.buffer[0], other.buffer[1]);
	}

	clone(): Vec2 {
		return new Vec2(this.#buffer.slice());
	}

	length() {
		return Math.sqrt(this.#buffer[0] * this.#buffer[0] + this.#buffer[1] * this.#buffer[1]);
	}

	lengthSquared() {
		return this.#buffer[0] * this.#buffer[0] + this.#buffer[1] * this.#buffer[1];
	}

	add(other: ReadonlyVec2) {
		this.#buffer[0] += other.buffer[0];
		this.#buffer[1] += other.buffer[1];
		return this;
	}

	sub(other: ReadonlyVec2) {
		this.#buffer[0] -= other.buffer[0];
		this.#buffer[1] -= other.buffer[1];
		return this;
	}

	mul(other: ReadonlyVec2) {
		this.#buffer[0] *= other.buffer[0];
		this.#buffer[1] *= other.buffer[1];
		return this;
	}

	mulScalar(scalar: number) {
		this.#buffer[0] *= scalar;
		this.#buffer[1] *= scalar;
		return this;
	}

	mulMat3(mat3: ReadonlyMat3) {
		const x = this.#buffer[0];
		const y = this.#buffer[1];
		this.#buffer[0] = mat3.buffer[0] * x + mat3.buffer[3] * y + mat3.buffer[6];
		this.#buffer[1] = mat3.buffer[1] * x + mat3.buffer[4] * y + mat3.buffer[7];
		return this;
	}

	div(other: ReadonlyVec2) {
		this.#buffer[0] /= other.buffer[0];
		this.#buffer[1] /= other.buffer[1];
		return this;
	}

	divScalar(scalar: number) {
		this.#buffer[0] /= scalar;
		this.#buffer[1] /= scalar;
		return this;
	}

	dot(other: ReadonlyVec2) {
		return this.#buffer[0] * other.buffer[0] + this.#buffer[1] * other.buffer[1];
	}

	negate() {
		this.#buffer[0] *= -1;
		this.#buffer[1] *= -1;
		return this;
	}

	cross(other: ReadonlyVec2) {
		return this.#buffer[0] * other.buffer[1] - this.#buffer[1] * other.buffer[0];
	}

	normalize() {
		return this.divScalar(this.length() || 1);
	}

	min(other: ReadonlyVec2) {
		this.#buffer[0] = Math.min(this.#buffer[0], other.buffer[0]);
		this.#buffer[1] = Math.min(this.#buffer[1], other.buffer[1]);
		return this;
	}

	max(other: ReadonlyVec2) {
		this.#buffer[0] = Math.max(this.#buffer[0], other.buffer[0]);
		this.#buffer[1] = Math.max(this.#buffer[1], other.buffer[1]);
		return this;
	}

	clamp(lower: ReadonlyVec2, upper: ReadonlyVec2) {
		return this.max(lower).min(upper);
	}

	clampLength(lower: number, upper: number) {
		const len = this.length();
		return this.mulScalar(Math.max(lower, Math.min(upper, len)) / (len || 1));
	}

	project(normal: ReadonlyVec2) {
		return this.mulScalar(this.dot(normal) / (normal.lengthSquared() || 1));
	}

	reflect(normal: ReadonlyVec2) {
		return this.sub(tv0.copy(normal).mulScalar(2 * this.dot(normal)));
	}

	angleTo(other: ReadonlyVec2) {
		const theta = this.dot(other) / Math.sqrt(this.lengthSquared() * other.lengthSquared());
		return Math.acos(Math.min(1, Math.max(-1, theta)));
	}

	distanceToSquared(other: ReadonlyVec2) {
		return this.copy(other).sub(this).lengthSquared();
	}

	distanceTo(other: ReadonlyVec2) {
		return Math.sqrt(this.distanceToSquared(other));
	}
}

export type ReadonlyVec2 = Pick<
	Vec2,
	"angleTo" | "buffer" | "distanceTo" | "distanceToSquared" | "dot" | "length" | "lengthSquared" | "x" | "y"
>;

const tv0 = new Vec2();
