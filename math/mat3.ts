import { NumberArray, NumberArrayConstructor } from "./arraylike.ts";

export class Mat3 {
	static IDENTITY: ReadonlyMat3 = new Mat3().makeIdentity();

	#buffer: NumberArray;
	constructor(buffer: NumberArray);
	constructor(ctor?: NumberArrayConstructor);
	constructor(buffer_or_ctor: NumberArray | NumberArrayConstructor = Array) {
		if (typeof buffer_or_ctor === "function") {
			let ctor = buffer_or_ctor;
			this.#buffer = new ctor(9);
			this.makeIdentity();
		} else {
			this.#buffer = buffer_or_ctor;
		}
	}

	get buffer() {
		return this.#buffer;
	}

	makeIdentity() {
		return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
	}

	set(m11: number, m12: number, m13: number, m21: number, m22: number, m23: number, m31: number, m32: number, m33: number) {
		this.#buffer[0] = m11;
		this.#buffer[1] = m12;
		this.#buffer[2] = m13;
		this.#buffer[3] = m21;
		this.#buffer[4] = m22;
		this.#buffer[5] = m23;
		this.#buffer[6] = m31;
		this.#buffer[7] = m32;
		this.#buffer[8] = m33;
		return this;
	}

	copy(other: ReadonlyMat3) {
		return this.set(
			other.buffer[0],
			other.buffer[1],
			other.buffer[2],
			other.buffer[3],
			other.buffer[4],
			other.buffer[5],
			other.buffer[6],
			other.buffer[7],
			other.buffer[8],
		);
	}

	mul(other: ReadonlyMat3) {
		const a11 = this.#buffer[0];
		const a12 = this.#buffer[1];
		const a13 = this.#buffer[2];
		const a21 = this.#buffer[3];
		const a22 = this.#buffer[4];
		const a23 = this.#buffer[5];
		const a31 = this.#buffer[6];
		const a32 = this.#buffer[7];
		const a33 = this.#buffer[8];
		const b11 = other.buffer[0];
		const b12 = other.buffer[1];
		const b13 = other.buffer[2];
		const b21 = other.buffer[3];
		const b22 = other.buffer[4];
		const b23 = other.buffer[5];
		const b31 = other.buffer[6];
		const b32 = other.buffer[7];
		const b33 = other.buffer[8];

		this.#buffer[0] = a11 * b11 + a12 * b21 + a13 * b31;
		this.#buffer[3] = a11 * b12 + a12 * b22 + a13 * b32;
		this.#buffer[6] = a11 * b13 + a12 * b23 + a13 * b33;
		this.#buffer[1] = a21 * b11 + a22 * b21 + a23 * b31;
		this.#buffer[4] = a21 * b12 + a22 * b22 + a23 * b32;
		this.#buffer[7] = a21 * b13 + a22 * b23 + a23 * b33;
		this.#buffer[2] = a31 * b11 + a32 * b21 + a33 * b31;
		this.#buffer[5] = a31 * b12 + a32 * b22 + a33 * b32;
		this.#buffer[8] = a31 * b13 + a32 * b23 + a33 * b33;
		return this;
	}

	determinant() {
		const a = this.#buffer[0];
		const b = this.#buffer[1];
		const c = this.#buffer[2];
		const d = this.#buffer[3];
		const e = this.#buffer[4];
		const f = this.#buffer[5];
		const g = this.#buffer[6];
		const h = this.#buffer[7];
		const i = this.#buffer[8];
		return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
	}

	transpose() {
		let tmp = 0;
		tmp = this.#buffer[1];
		this.#buffer[1] = this.#buffer[3];
		this.#buffer[3] = tmp;
		tmp = this.#buffer[2];
		this.#buffer[2] = this.#buffer[6];
		this.#buffer[6] = tmp;
		tmp = this.#buffer[5];
		this.#buffer[5] = this.#buffer[7];
		this.#buffer[7] = tmp;
		return this;
	}

	scale(x: number, y: number) {
		this.#buffer[0] *= x;
		this.#buffer[1] *= y;
		this.#buffer[3] *= x;
		this.#buffer[4] *= y;
		this.#buffer[6] *= x;
		this.#buffer[7] *= y;
		return this;
	}

	rotate(theta: number) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);

		const a11 = this.#buffer[0];
		const a12 = this.#buffer[1];
		const a13 = this.#buffer[2];
		const a21 = this.#buffer[3];
		const a22 = this.#buffer[4];
		const a23 = this.#buffer[5];
		const a31 = this.#buffer[6];
		const a32 = this.#buffer[7];
		const a33 = this.#buffer[8];

		this.#buffer[0] = c * a11 + s * a21;
		this.#buffer[1] = -s * a11 + c * a21;
		this.#buffer[3] = c * a12 + s * a22;
		this.#buffer[4] = -s * a12 + c * a22;
		this.#buffer[6] = c * a13 + s * a23;
		this.#buffer[7] = -s * a13 + c * a23;
		return this;
	}

	translate(x: number, y: number) {
		const a11 = this.#buffer[0];
		const a12 = this.#buffer[1];
		const a13 = this.#buffer[2];
		const a21 = this.#buffer[3];
		const a22 = this.#buffer[4];
		const a23 = this.#buffer[5];
		const a31 = this.#buffer[6];
		const a32 = this.#buffer[7];
		const a33 = this.#buffer[8];

		this.#buffer[0] = a11;
		this.#buffer[1] = a12;
		this.#buffer[2] = a13;
		this.#buffer[3] = a21;
		this.#buffer[4] = a22;
		this.#buffer[5] = a23;
		this.#buffer[6] = a31 + x;
		this.#buffer[7] = a32 + y;
		this.#buffer[8] = a33;
		return this;
	}

	negate() {
		this.#buffer[0] *= -1;
		this.#buffer[1] *= -1;
		this.#buffer[2] *= -1;
		this.#buffer[3] *= -1;
		this.#buffer[4] *= -1;
		this.#buffer[5] *= -1;
		this.#buffer[6] *= -1;
		this.#buffer[7] *= -1;
		this.#buffer[8] *= -1;
		return this;
	}
}

export type ReadonlyMat3 = Pick<
	Mat3,
	"buffer" | "determinant"
>;
