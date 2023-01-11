import { Vec3 } from "./vec3.ts";
import type { ReadonlyVec3 } from "./vec3.ts";

export class Mat4 {
	static IDENTITY: ReadonlyMat4 = new Mat4();

	public constructor(
		public n11 = 1,
		public n12 = 0,
		public n13 = 0,
		public n14 = 0,
		public n21 = 0,
		public n22 = 1,
		public n23 = 0,
		public n24 = 0,
		public n31 = 0,
		public n32 = 0,
		public n33 = 1,
		public n34 = 0,
		public n41 = 0,
		public n42 = 0,
		public n43 = 0,
		public n44 = 1,
	) { }

	fromArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		this.n11 = arrayBuffer[0];
		this.n12 = arrayBuffer[1];
		this.n13 = arrayBuffer[2];
		this.n14 = arrayBuffer[3];
		this.n21 = arrayBuffer[4];
		this.n22 = arrayBuffer[5];
		this.n23 = arrayBuffer[6];
		this.n24 = arrayBuffer[7];
		this.n31 = arrayBuffer[8];
		this.n32 = arrayBuffer[9];
		this.n33 = arrayBuffer[10];
		this.n34 = arrayBuffer[11];
		this.n41 = arrayBuffer[12];
		this.n42 = arrayBuffer[13];
		this.n43 = arrayBuffer[14];
		this.n44 = arrayBuffer[15];
		return this;
	}

	toArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		arrayBuffer[0] = this.n11;
		arrayBuffer[1] = this.n12;
		arrayBuffer[2] = this.n13;
		arrayBuffer[3] = this.n14;
		arrayBuffer[4] = this.n21;
		arrayBuffer[5] = this.n22;
		arrayBuffer[6] = this.n23;
		arrayBuffer[7] = this.n24;
		arrayBuffer[8] = this.n31;
		arrayBuffer[9] = this.n32;
		arrayBuffer[10] = this.n33;
		arrayBuffer[11] = this.n34;
		arrayBuffer[12] = this.n41;
		arrayBuffer[13] = this.n42;
		arrayBuffer[14] = this.n43;
		arrayBuffer[15] = this.n44;
		return this;
	}

	copy(other: ReadonlyMat4) {
		this.n11 = other.n11;
		this.n12 = other.n12;
		this.n13 = other.n13;
		this.n14 = other.n14;
		this.n21 = other.n21;
		this.n22 = other.n22;
		this.n23 = other.n23;
		this.n24 = other.n24;
		this.n31 = other.n31;
		this.n32 = other.n32;
		this.n33 = other.n33;
		this.n34 = other.n34;
		this.n41 = other.n41;
		this.n42 = other.n42;
		this.n43 = other.n43;
		this.n44 = other.n44;
		return this;
	}

	identity() {
		this.n11 = 1;
		this.n12 = 0;
		this.n13 = 0;
		this.n14 = 0;
		this.n21 = 0;
		this.n22 = 1;
		this.n23 = 0;
		this.n24 = 0;
		this.n31 = 0;
		this.n32 = 0;
		this.n33 = 1;
		this.n34 = 0;
		this.n41 = 0;
		this.n42 = 0;
		this.n43 = 0;
		this.n44 = 1;
	}

	mul(other: ReadonlyMat4) {
		this.n11 = this.n11 * other.n11 + this.n12 * other.n21 + this.n13 * other.n31 + this.n14 * other.n41;
		this.n21 = this.n11 * other.n12 + this.n12 * other.n22 + this.n13 * other.n32 + this.n14 * other.n42;
		this.n31 = this.n11 * other.n13 + this.n12 * other.n23 + this.n13 * other.n33 + this.n14 * other.n43;
		this.n41 = this.n11 * other.n14 + this.n12 * other.n24 + this.n13 * other.n34 + this.n14 * other.n44;
		this.n12 = this.n21 * other.n11 + this.n22 * other.n21 + this.n23 * other.n31 + this.n24 * other.n41;
		this.n22 = this.n21 * other.n12 + this.n22 * other.n22 + this.n23 * other.n32 + this.n24 * other.n42;
		this.n32 = this.n21 * other.n13 + this.n22 * other.n23 + this.n23 * other.n33 + this.n24 * other.n43;
		this.n42 = this.n21 * other.n14 + this.n22 * other.n24 + this.n23 * other.n34 + this.n24 * other.n44;
		this.n13 = this.n31 * other.n11 + this.n32 * other.n21 + this.n33 * other.n31 + this.n34 * other.n41;
		this.n23 = this.n31 * other.n12 + this.n32 * other.n22 + this.n33 * other.n32 + this.n34 * other.n42;
		this.n33 = this.n31 * other.n13 + this.n32 * other.n23 + this.n33 * other.n33 + this.n34 * other.n43;
		this.n43 = this.n31 * other.n14 + this.n32 * other.n24 + this.n33 * other.n34 + this.n34 * other.n44;
		this.n14 = this.n41 * other.n11 + this.n42 * other.n21 + this.n43 * other.n31 + this.n44 * other.n41;
		this.n24 = this.n41 * other.n12 + this.n42 * other.n22 + this.n43 * other.n32 + this.n44 * other.n42;
		this.n34 = this.n41 * other.n13 + this.n42 * other.n23 + this.n43 * other.n33 + this.n44 * other.n43;
		this.n44 = this.n41 * other.n14 + this.n42 * other.n24 + this.n43 * other.n34 + this.n44 * other.n44;
		return this;
	}

	mulScalar(scalar: number) {
		this.n11 *= scalar;
		this.n21 *= scalar;
		this.n31 *= scalar;
		this.n41 *= scalar;
		this.n12 *= scalar;
		this.n22 *= scalar;
		this.n32 *= scalar;
		this.n42 *= scalar;
		this.n13 *= scalar;
		this.n23 *= scalar;
		this.n33 *= scalar;
		this.n43 *= scalar;
		this.n14 *= scalar;
		this.n24 *= scalar;
		this.n34 *= scalar;
		this.n44 *= scalar;
		return this;
	}

	determinant() {
		return (
			this.n41 *
			(+this.n14 * this.n23 * this.n32 - this.n13 * this.n24 * this.n32 - this.n14 * this.n22 * this.n33 + this.n12 * this.n24 * this.n33 + this.n13 * this.n22 * this.n34 -
				this.n12 * this.n23 * this.n34) +
			this.n42 *
			(+this.n11 * this.n23 * this.n34 - this.n11 * this.n24 * this.n33 + this.n14 * this.n21 * this.n33 - this.n13 * this.n21 * this.n34 + this.n13 * this.n24 * this.n31 -
				this.n14 * this.n23 * this.n31) +
			this.n43 *
			(+this.n11 * this.n24 * this.n32 - this.n11 * this.n22 * this.n34 - this.n14 * this.n21 * this.n32 + this.n12 * this.n21 * this.n34 + this.n14 * this.n22 * this.n31 -
				this.n12 * this.n24 * this.n31) +
			this.n44 *
			(-this.n13 * this.n22 * this.n31 - this.n11 * this.n23 * this.n32 + this.n11 * this.n22 * this.n33 + this.n13 * this.n21 * this.n32 - this.n12 * this.n21 * this.n33 +
				this.n12 * this.n23 * this.n31)
		);
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
		tmp = this.n13;
		this.n13 = this.n31;
		this.n31 = tmp;
		tmp = this.n24;
		this.n24 = this.n42;
		this.n42 = tmp;
		tmp = this.n34;
		this.n34 = this.n43;
		this.n43 = tmp;
		return this;
	}

	position(position: ReadonlyVec3) {
		this.n41 = position.x;
		this.n42 = position.y;
		this.n43 = position.z;
		return this;
	}

	scale(x: number, y: number, z: number) {
		this.n11 *= x;
		this.n21 *= y;
		this.n31 *= z;
		this.n12 *= x;
		this.n22 *= y;
		this.n32 *= z;
		this.n13 *= x;
		this.n23 *= y;
		this.n33 *= z;
		this.n14 *= x;
		this.n24 *= y;
		this.n34 *= z;
		return this;
	}

	inverse(other: ReadonlyMat4) {
		const n11 = other.n11;
		const n21 = other.n21;
		const n31 = other.n31;
		const n41 = other.n41;
		const n12 = other.n12;
		const n22 = other.n22;
		const n32 = other.n32;
		const n42 = other.n42;
		const n13 = other.n13;
		const n23 = other.n23;
		const n33 = other.n33;
		const n43 = other.n43;
		const n14 = other.n14;
		const n24 = other.n24;
		const n34 = other.n34;
		const n44 = other.n44;
		const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
		const t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
		const t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
		const t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

		const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
		if (det === 0) {
			return this.identity();
		}

		const detInv = 1 / det;
		this.n11 = t11 * detInv;
		this.n12 = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) *
			detInv;
		this.n13 = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) *
			detInv;
		this.n14 = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) *
			detInv;

		this.n21 = t12 * detInv;
		this.n22 = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) *
			detInv;
		this.n23 = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) *
			detInv;
		this.n24 = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) *
			detInv;

		this.n31 = t13 * detInv;
		this.n32 = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) *
			detInv;
		this.n33 = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) *
			detInv;
		this.n34 = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) *
			detInv;

		this.n41 = t14 * detInv;
		this.n42 = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) *
			detInv;
		this.n43 = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) *
			detInv;
		this.n44 = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) *
			detInv;
		return this;
	}

	// compose(
	// 	position: Vector3 | ReadonlyVector3,
	// 	rotation: Quaternion | ReadonlyQuaternion,
	// 	scale: Vector3 | ReadonlyVector3
	// ) {
	// 	const te = this.elements;

	// 	const x = rotation.x;
	// 	const y = rotation.y;
	// 	const z = rotation.z;
	// 	const w = rotation.w;
	// 	const x2 = x + x;
	// 	const y2 = y + y;
	// 	const z2 = z + z;
	// 	const xx = x * x2;
	// 	const xy = x * y2;
	// 	const xz = x * z2;
	// 	const yy = y * y2;
	// 	const yz = y * z2;
	// 	const zz = z * z2;
	// 	const wx = w * x2;
	// 	const wy = w * y2;
	// 	const wz = w * z2;

	// 	const px = position.x;
	// 	const py = position.y;
	// 	const pz = position.z;
	// 	const sx = scale.x;
	// 	const sy = scale.y;
	// 	const sz = scale.z;

	// 	te[0] = (1 - (yy + zz)) * sx;
	// 	te[1] = (xy + wz) * sx;
	// 	te[2] = (xz - wy) * sx;
	// 	te[3] = 0;

	// 	te[4] = (xy - wz) * sy;
	// 	te[5] = (1 - (xx + zz)) * sy;
	// 	te[6] = (yz + wx) * sy;
	// 	te[7] = 0;

	// 	te[8] = (xz + wy) * sz;
	// 	te[9] = (yz - wx) * sz;
	// 	te[10] = (1 - (xx + yy)) * sz;
	// 	te[11] = 0;

	// 	te[12] = px;
	// 	te[13] = py;
	// 	te[14] = pz;
	// 	te[15] = 1;

	// 	return this;
	// }

	// decompose(position: Vector3, rotation: Quaternion, scale: Vector3) {
	// 	const te = this.elements;

	// 	const det = this.determinant();

	// 	const sx = tv0.set(te[0], te[1], te[2]).length * (det < 0 ? -1 : 1);
	// 	const sy = tv0.set(te[4], te[5], te[6]).length;
	// 	const sz = tv0.set(te[8], te[9], te[10]).length;

	// 	position.x = te[12];
	// 	position.y = te[13];
	// 	position.z = te[14];

	// 	tm0.copy(this);

	// 	const invSX = 1 / sx;
	// 	const invSY = 1 / sy;
	// 	const invSZ = 1 / sz;

	// 	tm0.elements[0] *= invSX;
	// 	tm0.elements[1] *= invSX;
	// 	tm0.elements[2] *= invSX;

	// 	tm0.elements[4] *= invSY;
	// 	tm0.elements[5] *= invSY;
	// 	tm0.elements[6] *= invSY;

	// 	tm0.elements[8] *= invSZ;
	// 	tm0.elements[9] *= invSZ;
	// 	tm0.elements[10] *= invSZ;

	// 	rotation.setFromRotationMatrix(tm0);

	// 	scale.x = sx;
	// 	scale.y = sy;
	// 	scale.z = sz;
	// }

	// // makeTranslation(x: number, y: number, z: number) {
	// // 	return this.set(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1);
	// // }

	// // makeRotationX(theta: number) {
	// // 	const c = Math.cos(theta);
	// // 	const s = Math.sin(theta);
	// // 	return this.set(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1);
	// // }

	// // makeRotationY(theta: number) {
	// // 	const c = Math.cos(theta);
	// // 	const s = Math.sin(theta);
	// // 	return this.set(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1);
	// // }

	// // makeRotationZ(theta: number) {
	// // 	const c = Math.cos(theta);
	// // 	const s = Math.sin(theta);
	// // 	return this.set(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	// // }

	// // makeRotationAxis(axis: Vector3 | ReadonlyVector3, angle: number) {
	// // 	const c = Math.cos(angle);
	// // 	const s = Math.sin(angle);
	// // 	const t = 1 - c;
	// // 	const x = axis.x;
	// // 	const y = axis.y;
	// // 	const z = axis.z;
	// // 	const tx = t * x;
	// // 	const ty = t * y;
	// // 	return this.set(
	// // 		tx * x + c,
	// // 		tx * y - s * z,
	// // 		tx * z + s * y,
	// // 		0,
	// // 		tx * y + s * z,
	// // 		ty * y + c,
	// // 		ty * z - s * x,
	// // 		0,
	// // 		tx * z - s * y,
	// // 		ty * z + s * x,
	// // 		t * z * z + c,
	// // 		0,
	// // 		0,
	// // 		0,
	// // 		0,
	// // 		1
	// // 	);
	// // }

	// makeTranslationFromVector3(vector: Vector3 | ReadonlyVector3) {
	// 	return this.compose(
	// 		vector,
	// 		Quaternion.Identity,
	// 		Vector3.One
	// 	);
	// }

	// makeRotationFromQuaternion(quaternion: Quaternion | ReadonlyQuaternion) {
	// 	return this.compose(
	// 		Vector3.Zero,
	// 		quaternion,
	// 		Vector3.One
	// 	);
	// }

	// makeRotationFromEuler(euler: Euler | ReadonlyEuler) {
	// 	return this.compose(
	// 		Vector3.Zero,
	// 		tq0.setFromEuler(euler),
	// 		Vector3.One
	// 	);
	// }

	// makeScaleFromVector3(vector: Vector3 | ReadonlyVector3) {
	// 	return this.compose(
	// 		Vector3.Zero,
	// 		Quaternion.Identity,
	// 		vector
	// 	);
	// }

	// // makeScale(x: number, y: number, z: number) {
	// // 	return this.set(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1);
	// // }

	// // makeShear(x: number, y: number, z: number) {
	// // 	return this.set(1, y, z, 0, x, 1, z, 0, x, y, 1, 0, 0, 0, 0, 1);
	// // }

	makePerspective(left: number, right: number, top: number, bottom: number, near: number, far: number) {
		const x = (2 * near) / (right - left);
		const y = (2 * near) / (top - bottom);
		const a = (right + left) / (right - left);
		const b = (top + bottom) / (top - bottom);
		const c = -(far + near) / (far - near);
		const d = (-2 * far * near) / (far - near);
		this.n11 = x;
		this.n21 = 0;
		this.n31 = a;
		this.n41 = 0;
		this.n12 = 0;
		this.n22 = y;
		this.n32 = b;
		this.n42 = 0;
		this.n13 = 0;
		this.n23 = 0;
		this.n33 = c;
		this.n43 = d;
		this.n14 = 0;
		this.n24 = 0;
		this.n34 = -1;
		this.n44 = 0;
		return this;
	}

	makeOrthographic(left: number, right: number, top: number, bottom: number, near: number, far: number) {
		const w = 1.0 / (right - left);
		const h = 1.0 / (top - bottom);
		const p = 1.0 / (far - near);
		const x = (right + left) * w;
		const y = (top + bottom) * h;
		const z = (far + near) * p;
		this.n11 = 2 * w;
		this.n21 = 0;
		this.n31 = 0;
		this.n41 = -x;
		this.n12 = 0;
		this.n22 = 2 * h;
		this.n32 = 0;
		this.n42 = -y;
		this.n13 = 0;
		this.n23 = 0;
		this.n33 = -2 * p;
		this.n43 = -z;
		this.n14 = 0;
		this.n24 = 0;
		this.n34 = 0;
		this.n44 = 1;
		return this;
	}

	lookAt(eye: ReadonlyVec3, target: ReadonlyVec3, up: ReadonlyVec3) {
		tv0.copy(eye).sub(target);

		// eye and target are in the same position
		if (tv0.lengthSquared === 0) {
			tv0.z = 1;
		}

		tv0.normalize();
		tv1.copy(up).cross(tv0);

		// up and tv0 are parallel
		if (tv1.lengthSquared === 0) {
			tv0.z += Math.abs(up.z) === 1 ? 0.0001 : -0.0001;
			tv0.normalize();
			tv1.copy(up).cross(tv0);
		}

		tv1.normalize();
		tv2.copy(tv0).cross(tv1);

		this.n11 = tv1.x;
		this.n12 = tv1.y;
		this.n13 = tv1.z;
		this.n21 = tv2.x;
		this.n22 = tv2.y;
		this.n23 = tv2.z;
		this.n31 = tv0.x;
		this.n32 = tv0.y;
		this.n33 = tv0.z;
		return this;
	}
}

export type ReadonlyMat4 = Pick<
	Readonly<Mat4>,
	"n11" | "n12" | "n13" | "n14" | "n21" | "n22" | "n23" | "n24" | "n31" | "n32" | "n33" | "n34" | "n41" | "n42" | "n43" | "n44" | "determinant" | "toArrayBuffer"
>;

const tv0 = new Vec3();
const tv1 = new Vec3();
const tv2 = new Vec3();
