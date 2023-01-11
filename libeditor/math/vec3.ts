import type { ReadonlyMat3 } from "./mat3.ts";
import type { ReadonlyMat4 } from "./mat4.ts";

export class Vec3 {
	static ZERO: ReadonlyVec3 = new Vec3(0, 0, 0);
	static ONE: ReadonlyVec3 = new Vec3(1, 1, 1);
	static RIGHT: ReadonlyVec3 = new Vec3(1, 0, 0);
	static UP: ReadonlyVec3 = new Vec3(0, 1, 0);
	static FORWARD: ReadonlyVec3 = new Vec3(0, 0, 1);

	public constructor(public x = 0, public y = 0, public z = 0) { }

	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}
	get lengthSquared() {
		return this.x * this.x + this.y * this.y + this.z * this.z;
	}

	fromArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		this.x = arrayBuffer[0];
		this.y = arrayBuffer[1];
		this.z = arrayBuffer[2];
		return this;
	}

	toArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		arrayBuffer[0] = this.x;
		arrayBuffer[1] = this.y;
		arrayBuffer[2] = this.z;
		return this;
	}

	copy(other: ReadonlyVec3) {
		this.x = other.x;
		this.y = other.y;
		this.z = other.z;
		return this;
	}

	add(other: ReadonlyVec3) {
		this.x += other.x;
		this.y += other.y;
		this.z += other.z;
		return this;
	}

	sub(other: ReadonlyVec3) {
		this.x -= other.x;
		this.y -= other.y;
		this.z -= other.z;
		return this;
	}

	mul(other: ReadonlyVec3) {
		this.x *= other.x;
		this.y *= other.y;
		this.z *= other.z;
		return this;
	}

	mulScalar(scalar: number) {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		return this;
	}

	mulMat3(mat: ReadonlyMat3) {
		const x = this.x;
		const y = this.y;
		const z = this.z;
		this.x = mat.n11 * x + mat.n21 * y + mat.n31 * z;
		this.y = mat.n12 * x + mat.n22 * y + mat.n32 * z;
		this.z = mat.n13 * x + mat.n23 * y + mat.n33 * z;
		return this;
	}

	mulMat4(mat: ReadonlyMat4) {
		const x = this.x;
		const y = this.y;
		const z = this.z;
		const w = 1 / (mat.n14 * x + mat.n24 * y + mat.n34 * z + mat.n44);
		this.x = (mat.n11 * x + mat.n21 * y + mat.n31 * z + mat.n41) * w;
		this.y = (mat.n12 * x + mat.n22 * y + mat.n32 * z + mat.n42) * w;
		this.z = (mat.n13 * x + mat.n23 * y + mat.n33 * z + mat.n43) * w;
		return this;
	}

	div(other: ReadonlyVec3) {
		this.x /= other.x;
		this.y /= other.y;
		this.z /= other.z;
		return this;
	}

	divScalar(scalar: number) {
		this.x /= scalar;
		this.y /= scalar;
		this.z /= scalar;
		return this;
	}

	dot(other: ReadonlyVec3) {
		return this.x * other.x + this.y * other.y + this.z * other.z;
	}

	cross(other: ReadonlyVec3) {
		const ax = this.x;
		const bx = other.x;
		const ay = this.y;
		const by = other.y;
		const az = this.z;
		const bz = other.z;
		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;
		return this;
	}

	normalize() {
		return this.divScalar(this.length);
	}

	min(other: ReadonlyVec3) {
		this.x = Math.min(this.x, other.x);
		this.y = Math.min(this.y, other.y);
		this.z = Math.min(this.z, other.z);
		return this;
	}

	max(other: ReadonlyVec3) {
		this.x = Math.max(this.x, other.x);
		this.y = Math.max(this.y, other.y);
		this.z = Math.max(this.z, other.z);
		return this;
	}

	clamp(lower: ReadonlyVec3, upper: ReadonlyVec3) {
		return this.min(upper).max(lower);
	}

	clampLength(lower: number, upper: number) {
		const len = this.length;
		return this.divScalar(len).mulScalar(Math.max(lower, Math.min(upper, len)));
	}

	project(normal: ReadonlyVec3) {
		this.mulScalar(this.dot(normal) / normal.lengthSquared);
	}

	reflect(normal: ReadonlyVec3) {
		tv0.copy(normal).mulScalar(2 * this.dot(normal));
		return this.sub(tv0);
	}

	angleTo(other: ReadonlyVec3) {
		const theta = this.dot(other) / Math.sqrt(this.lengthSquared * other.lengthSquared);
		return Math.acos(Math.min(1, Math.max(-1, theta)));
	}

	distanceTo(other: ReadonlyVec3) {
		return Math.sqrt(this.distanceToSquared(other));
	}

	distanceToSquared(other: ReadonlyVec3) {
		return tv0.copy(this).sub(other).lengthSquared;
	}
}

export type ReadonlyVec3 = Pick<Readonly<Vec3>, "x" | "y" | "z" | "length" | "lengthSquared" | "angleTo" | "distanceTo" | "distanceToSquared" | "dot" | "cross" | "toArrayBuffer">;

const tv0 = new Vec3();
