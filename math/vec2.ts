import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import type { Mat3 } from "./mat3.ts";

export class Vec2 {
	static ZERO: Readonly<Vec2> = new Vec2(0, 0);
	static ONE: Readonly<Vec2> = new Vec2(1, 1);
	static RIGHT: Readonly<Vec2> = new Vec2(1, 0);
	static UP: Readonly<Vec2> = new Vec2(0, 1);

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

	copy(other: Readonly<Vec2>) {
		return this.set(other.buffer[0], other.buffer[1]);
	}

	length() {
		return Math.sqrt(this.#buffer[0] * this.#buffer[0] + this.#buffer[1] * this.#buffer[1]);
	}

	lengthSquared() {
		return this.#buffer[0] * this.#buffer[0] + this.#buffer[1] * this.#buffer[1];
	}

	add(other: Readonly<Vec2>) {
		this.#buffer[0] += other.buffer[0];
		this.#buffer[1] += other.buffer[1];
		return this;
	}

	sub(other: Readonly<Vec2>) {
		this.#buffer[0] -= other.buffer[0];
		this.#buffer[1] -= other.buffer[1];
		return this;
	}

	mul(other: Readonly<Vec2>) {
		this.#buffer[0] *= other.buffer[0];
		this.#buffer[1] *= other.buffer[1];
		return this;
	}

	mulScalar(scalar: number) {
		this.#buffer[0] *= scalar;
		this.#buffer[1] *= scalar;
		return this;
	}

	mulMat3(mat3: Readonly<Mat3>) {
		const x = this.#buffer[0];
		const y = this.#buffer[1];
		this.#buffer[0] = mat3.buffer[0] * x + mat3.buffer[3] * y + mat3.buffer[6];
		this.#buffer[1] = mat3.buffer[1] * x + mat3.buffer[4] * y + mat3.buffer[7];
		return this;
	}

	div(other: Readonly<Vec2>) {
		this.#buffer[0] /= other.buffer[0];
		this.#buffer[1] /= other.buffer[1];
		return this;
	}

	divScalar(scalar: number) {
		this.#buffer[0] /= scalar;
		this.#buffer[1] /= scalar;
		return this;
	}

	dot(other: Readonly<Vec2>) {
		return this.#buffer[0] * other.buffer[0] + this.#buffer[1] * other.buffer[1];
	}

	negate() {
		this.#buffer[0] *= -1;
		this.#buffer[1] *= -1;
		return this;
	}

	cross(other: Readonly<Vec2>) {
		return this.#buffer[0] * other.buffer[1] - this.#buffer[1] * other.buffer[0];
	}

	normalize() {
		return this.divScalar(this.length() || 1);
	}

	min(other: Readonly<Vec2>) {
		this.#buffer[0] = Math.min(this.#buffer[0], other.buffer[0]);
		this.#buffer[1] = Math.min(this.#buffer[1], other.buffer[1]);
		return this;
	}

	max(other: Readonly<Vec2>) {
		this.#buffer[0] = Math.max(this.#buffer[0], other.buffer[0]);
		this.#buffer[1] = Math.max(this.#buffer[1], other.buffer[1]);
		return this;
	}

	clamp(lower: Readonly<Vec2>, upper: Readonly<Vec2>) {
		return this.max(lower).min(upper);
	}

	clampLength(lower: number, upper: number) {
		const len = this.length();
		return this.mulScalar(Math.max(lower, Math.min(upper, len)) / (len || 1));
	}

	project(normal: Readonly<Vec2>) {
		return this.mulScalar(this.dot(normal) / (normal.lengthSquared() || 1));
	}

	reflect(normal: Readonly<Vec2>) {
		return this.sub(tv0.copy(normal).mulScalar(2 * this.dot(normal)));
	}

	angleTo(other: Readonly<Vec2>) {
		const theta = this.dot(other) / Math.sqrt(this.lengthSquared() * other.lengthSquared());
		return Math.acos(Math.min(1, Math.max(-1, theta)));
	}

	distanceToSquared(other: Readonly<Vec2>) {
		return this.copy(other).sub(this).lengthSquared();
	}

	distanceTo(other: Readonly<Vec2>) {
		return Math.sqrt(this.distanceToSquared(other));
	}
}

const tv0 = new Vec2();
