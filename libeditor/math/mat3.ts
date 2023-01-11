export class Mat3 {
	static IDENTITY: ReadonlyMat3 = new Mat3();

	public constructor(public n11 = 1, public n12 = 0, public n13 = 0, public n21 = 0, public n22 = 1, public n23 = 0, public n31 = 0, public n32 = 0, public n33 = 1) { }

	fromArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		this.n11 = arrayBuffer[0];
		this.n12 = arrayBuffer[1];
		this.n13 = arrayBuffer[2];
		this.n21 = arrayBuffer[3];
		this.n22 = arrayBuffer[4];
		this.n23 = arrayBuffer[5];
		this.n31 = arrayBuffer[6];
		this.n32 = arrayBuffer[7];
		this.n33 = arrayBuffer[8];
		return this;
	}

	toArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		arrayBuffer[0] = this.n11;
		arrayBuffer[1] = this.n12;
		arrayBuffer[2] = this.n13;
		arrayBuffer[3] = this.n21;
		arrayBuffer[4] = this.n22;
		arrayBuffer[5] = this.n23;
		arrayBuffer[6] = this.n31;
		arrayBuffer[7] = this.n32;
		arrayBuffer[8] = this.n33;
		return this;
	}

	copy(other: ReadonlyMat3) {
		this.n11 = other.n11;
		this.n12 = other.n12;
		this.n13 = other.n13;
		this.n21 = other.n21;
		this.n22 = other.n22;
		this.n23 = other.n23;
		this.n31 = other.n31;
		this.n32 = other.n32;
		this.n33 = other.n33;
		return this;
	}

	identity() {
		this.n11 = 1;
		this.n12 = 0;
		this.n13 = 0;
		this.n21 = 0;
		this.n22 = 1;
		this.n23 = 0;
		this.n31 = 0;
		this.n32 = 0;
		this.n33 = 1;
		return this;
	}

	mul(other: ReadonlyMat3) {
		this.n11 = this.n11 * other.n11 + this.n12 * other.n21 + this.n12 * other.n31;
		this.n12 = this.n21 * other.n11 + this.n22 * other.n21 + this.n23 * other.n31;
		this.n13 = this.n31 * other.n11 + this.n32 * other.n21 + this.n33 * other.n31;
		this.n21 = this.n11 * other.n12 + this.n12 * other.n22 + this.n12 * other.n23;
		this.n22 = this.n21 * other.n12 + this.n22 * other.n22 + this.n23 * other.n23;
		this.n23 = this.n31 * other.n12 + this.n32 * other.n22 + this.n33 * other.n23;
		this.n31 = this.n11 * other.n21 + this.n12 * other.n32 + this.n12 * other.n33;
		this.n32 = this.n21 * other.n21 + this.n22 * other.n32 + this.n23 * other.n33;
		this.n33 = this.n31 * other.n21 + this.n32 * other.n32 + this.n33 * other.n33;
		return this;
	}

	mulScalar(scalar: number) {
		this.n11 *= scalar;
		this.n12 *= scalar;
		this.n13 *= scalar;
		this.n21 *= scalar;
		this.n22 *= scalar;
		this.n23 *= scalar;
		this.n31 *= scalar;
		this.n32 *= scalar;
		this.n33 *= scalar;
		return this;
	}

	determinant() {
		const a = this.n11;
		const b = this.n12;
		const c = this.n13;
		const d = this.n21;
		const e = this.n22;
		const f = this.n23;
		const g = this.n31;
		const h = this.n32;
		const i = this.n33;
		return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
	}

	transpose() {
		let tmp = 0;
		tmp = this.n12;
		this.n12 = this.n21;
		this.n21 = tmp;
		tmp = this.n13;
		this.n13 = this.n31;
		this.n31 = tmp;
		tmp = this.n23;
		this.n23 = this.n32;
		this.n32 = tmp;
		return this;
	}

	scale(x: number, y: number) {
		this.n11 *= x;
		this.n12 *= y;
		this.n21 *= x;
		this.n22 *= y;
		this.n31 *= x;
		this.n32 *= y;
		return this;
	}

	rotate(theta: number) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);
		this.n11 = c * this.n11 + s * this.n21;
		this.n12 = -s * this.n11 + c * this.n21;
		this.n21 = c * this.n12 + s * this.n22;
		this.n22 = -s * this.n12 + c * this.n22;
		this.n31 = c * this.n13 + s * this.n23;
		this.n32 = -s * this.n13 + c * this.n23;
		return this;
	}

	translate(x: number, y: number) {
		this.n11 += x * this.n13;
		this.n21 += x * this.n23;
		this.n31 += x * this.n33;
		this.n12 += y * this.n13;
		this.n22 += y * this.n23;
		this.n32 += y * this.n33;
		return this;
	}
}

export type ReadonlyMat3 = Pick<Readonly<Mat3>, "n11" | "n12" | "n13" | "n21" | "n22" | "n23" | "n31" | "n32" | "n33" | "determinant" | "toArrayBuffer">;
