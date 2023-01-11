import type { ReadonlyMat3 } from "./mat3.ts";

export class Vec2 {
	static ZERO: ReadonlyVec2 = new Vec2(0, 0);
	static ONE: ReadonlyVec2 = new Vec2(1, 1);
	static RIGHT: ReadonlyVec2 = new Vec2(1, 0);
	static UP: ReadonlyVec2 = new Vec2(0, 1);

	public constructor(public x = 0, public y = 0) { }

	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	get lengthSquared() {
		return this.x * this.x + this.y * this.y;
	}

	fromArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		this.x = arrayBuffer[0];
		this.y = arrayBuffer[1];
		return this;
	}

	toArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		arrayBuffer[0] = this.x;
		arrayBuffer[1] = this.y;
		return this;
	}

	copy(other: ReadonlyVec2) {
		this.x = other.x;
		this.y = other.y;
		return this;
	}

	add(other: ReadonlyVec2) {
		this.x += other.x;
		this.y += other.y;
		return this;
	}

	sub(other: ReadonlyVec2) {
		this.x -= other.x;
		this.y -= other.y;
		return this;
	}

	mul(other: ReadonlyVec2) {
		this.x *= other.x;
		this.y *= other.y;
		return this;
	}

	mulScalar(scalar: number) {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	}

	mulMat3(mat: ReadonlyMat3) {
		const x = this.x;
		const y = this.y;
		this.x = mat.n11 * x + mat.n21 * y + mat.n31;
		this.y = mat.n12 * x + mat.n22 * y + mat.n32;
		return this;
	}

	div(other: ReadonlyVec2) {
		this.x /= other.x;
		this.y /= other.y;
		return this;
	}

	divScalar(scalar: number) {
		this.x /= scalar;
		this.y /= scalar;
		return this;
	}

	dot(other: ReadonlyVec2) {
		return this.x * other.x + this.y * other.y;
	}

	cross(other: ReadonlyVec2) {
		return this.x * other.x - this.y * other.y;
	}

	normalize() {
		return this.divScalar(this.length);
	}

	min(other: ReadonlyVec2) {
		this.x = Math.min(this.x, other.x);
		this.y = Math.min(this.y, other.y);
		return this;
	}

	max(other: ReadonlyVec2) {
		this.x = Math.max(this.x, other.x);
		this.y = Math.max(this.y, other.y);
		return this;
	}

	clamp(lower: ReadonlyVec2, upper: ReadonlyVec2) {
		return this.min(upper).max(lower);
	}

	clampLength(lower: number, upper: number) {
		const len = this.length;
		return this.divScalar(len).mulScalar(Math.max(lower, Math.min(upper, len)));
	}

	project(normal: ReadonlyVec2) {
		this.mulScalar(this.dot(normal) / normal.lengthSquared);
	}

	reflect(normal: ReadonlyVec2) {
		tv0.copy(normal).mulScalar(2 * this.dot(normal));
		return this.sub(tv0);
	}

	angleTo(other: ReadonlyVec2) {
		const theta = this.dot(other) / Math.sqrt(this.lengthSquared * other.lengthSquared);
		return Math.acos(Math.min(1, Math.max(-1, theta)));
	}

	distanceTo(other: ReadonlyVec2) {
		return Math.sqrt(this.distanceToSquared(other));
	}

	distanceToSquared(other: ReadonlyVec2) {
		return tv0.copy(this).sub(other).lengthSquared;
	}
}

export type ReadonlyVec2 = Pick<Readonly<Vec2>, "x" | "y" | "length" | "lengthSquared" | "angleTo" | "distanceTo" | "distanceToSquared" | "dot" | "cross" | "toArrayBuffer">;

const tv0 = new Vec2();
