import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import type { ReadonlyMat3 } from "./mat3.ts";
import type { ReadonlyMat4 } from "./mat4.ts";

export class Vec3 {
	static ZERO: ReadonlyVec3 = new Vec3(0, 0, 0);
	static ONE: ReadonlyVec3 = new Vec3(1, 1, 1);
	static RIGHT: ReadonlyVec3 = new Vec3(1, 0, 0);
	static UP: ReadonlyVec3 = new Vec3(0, 1, 0);
	static FORWARD: ReadonlyVec3 = new Vec3(0, 0, 1);

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

	copy(other: ReadonlyVec3) {
		return this.set(other.buffer[0], other.buffer[1], other.buffer[2]);
	}

	clone(): Vec3 {
		return new Vec3(this.#buffer.slice());
	}

	length() {
		return Math.sqrt(this.#buffer[0] * this.#buffer[0] + this.#buffer[1] * this.#buffer[1] + this.#buffer[2] * this.#buffer[2]);
	}

	lengthSquared() {
		return this.#buffer[0] * this.#buffer[0] + this.#buffer[1] * this.#buffer[1] + this.#buffer[2] * this.#buffer[2];
	}

	add(other: ReadonlyVec3) {
		this.#buffer[0] += other.buffer[0];
		this.#buffer[1] += other.buffer[1];
		this.#buffer[2] += other.buffer[2];
		return this;
	}

	sub(other: ReadonlyVec3) {
		this.#buffer[0] -= other.buffer[0];
		this.#buffer[1] -= other.buffer[1];
		this.#buffer[2] -= other.buffer[2];
		return this;
	}

	mul(other: ReadonlyVec3) {
		this.#buffer[0] *= other.buffer[0];
		this.#buffer[1] *= other.buffer[1];
		this.#buffer[2] *= other.buffer[2];
		return this;
	}

	mulScalar(scalar: number) {
		this.#buffer[0] *= scalar;
		this.#buffer[1] *= scalar;
		this.#buffer[2] *= scalar;
		return this;
	}

	negate() {
		return this.mulScalar(-1);
	}

	div(other: ReadonlyVec3) {
		this.#buffer[0] /= other.buffer[0];
		this.#buffer[1] /= other.buffer[1];
		this.#buffer[2] /= other.buffer[2];
		return this;
	}

	divScalar(scalar: number) {
		this.#buffer[0] /= scalar;
		this.#buffer[1] /= scalar;
		this.#buffer[2] /= scalar;
		return this;
	}

	mulMat3(mat3: ReadonlyMat3) {
		const x = this.#buffer[0];
		const y = this.#buffer[1];
		const z = this.#buffer[2];
		this.#buffer[0] = mat3.buffer[0] * x + mat3.buffer[3] * y + mat3.buffer[6] * z;
		this.#buffer[1] = mat3.buffer[1] * x + mat3.buffer[4] * y + mat3.buffer[7] * z;
		this.#buffer[2] = mat3.buffer[2] * x + mat3.buffer[5] * y + mat3.buffer[8] * z;
		return this;
	}

	mulMat4(mat4: ReadonlyMat4) {
		const x = this.#buffer[0];
		const y = this.#buffer[1];
		const z = this.#buffer[2];
		const w = 1 / (mat4.buffer[3] * x + mat4.buffer[7] * y + mat4.buffer[11] * z + mat4.buffer[15]);
		this.#buffer[0] = (mat4.buffer[0] * x + mat4.buffer[4] * y + mat4.buffer[8] * z + mat4.buffer[12]) * w;
		this.#buffer[1] = (mat4.buffer[1] * x + mat4.buffer[5] * y + mat4.buffer[9] * z + mat4.buffer[13]) * w;
		this.#buffer[2] = (mat4.buffer[2] * x + mat4.buffer[6] * y + mat4.buffer[10] * z + mat4.buffer[14]) * w;
		return this;
	}

	dot(other: ReadonlyVec3) {
		return this.#buffer[0] * other.buffer[0] + this.#buffer[1] * other.buffer[1] + this.#buffer[2] * other.buffer[2];
	}

	cross(other: ReadonlyVec3) {
		const ax = this.#buffer[0];
		const ay = this.#buffer[1];
		const az = this.#buffer[2];
		const bx = other.buffer[0];
		const by = other.buffer[1];
		const bz = other.buffer[2];
		this.#buffer[0] = ay * bz - az * by;
		this.#buffer[1] = az * bx - ax * bz;
		this.#buffer[2] = ax * by - ay * bx;
		return this;
	}

	normalize() {
		return this.divScalar(this.length() || 1);
	}

	min(other: ReadonlyVec3) {
		this.#buffer[0] = Math.min(this.#buffer[0], other.buffer[0]);
		this.#buffer[1] = Math.min(this.#buffer[1], other.buffer[1]);
		this.#buffer[2] = Math.min(this.#buffer[2], other.buffer[2]);
		return this;
	}

	max(other: ReadonlyVec3) {
		this.#buffer[0] = Math.max(this.#buffer[0], other.buffer[0]);
		this.#buffer[1] = Math.max(this.#buffer[1], other.buffer[1]);
		this.#buffer[2] = Math.max(this.#buffer[2], other.buffer[2]);
		return this;
	}

	clamp(lower: ReadonlyVec3, upper: ReadonlyVec3) {
		return this.max(lower).min(upper);
	}

	clampLength(lower: number, upper: number) {
		const len = this.length();
		return this.mulScalar(Math.max(lower, Math.min(upper, len)) / (len || 1));
	}

	project(normal: ReadonlyVec3) {
		return this.mulScalar(this.dot(normal) / normal.lengthSquared());
	}

	reflect(normal: ReadonlyVec3) {
		return this.sub(tv0.copy(normal).mulScalar(2 * this.dot(normal)));
	}

	angleTo(other: ReadonlyVec3) {
		const theta = this.dot(other) / Math.sqrt(this.lengthSquared() * other.lengthSquared());
		return Math.acos(Math.min(1, Math.max(-1, theta)));
	}

	distanceToSquared(other: ReadonlyVec3) {
		return this.copy(tv0).sub(other).lengthSquared();
	}

	distanceTo(other: ReadonlyVec3) {
		return Math.sqrt(this.distanceToSquared(other));
	}
}

export type ReadonlyVec3 = Pick<
	Vec3,
	"angleTo" | "buffer" | "distanceTo" | "distanceToSquared" | "dot" | "length" | "lengthSquared" | "x" | "y" | "z"
>;

const tv0: Vec3 = new Vec3(0, 0, 0);
