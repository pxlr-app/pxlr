import { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import type { Euler } from "./euler.ts";
import { Quaternion } from "./quaternion.ts";
import { Vec3 } from "./vec3.ts";

export class Mat4 {
	static IDENTITY: Readonly<Mat4> = new Mat4().makeIdentity();

	#buffer: NumberArray;

	constructor(buffer: NumberArray);
	constructor(ctor?: NumberArrayConstructor);
	constructor(buffer_or_ctor: NumberArray | NumberArrayConstructor = Array) {
		if (typeof buffer_or_ctor === "function") {
			let ctor = buffer_or_ctor;
			this.#buffer = new ctor(16);
			this.makeIdentity();
		} else {
			this.#buffer = buffer_or_ctor;
		}
	}

	get buffer() {
		return this.#buffer;
	}

	makeIdentity() {
		return this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}

	set(
		m11: number,
		m12: number,
		m13: number,
		m14: number,
		m21: number,
		m22: number,
		m23: number,
		m24: number,
		m31: number,
		m32: number,
		m33: number,
		m34: number,
		m41: number,
		m42: number,
		m43: number,
		m44: number,
	) {
		this.#buffer[0] = m11;
		this.#buffer[1] = m12;
		this.#buffer[2] = m13;
		this.#buffer[3] = m14;
		this.#buffer[4] = m21;
		this.#buffer[5] = m22;
		this.#buffer[6] = m23;
		this.#buffer[7] = m24;
		this.#buffer[8] = m31;
		this.#buffer[9] = m32;
		this.#buffer[10] = m33;
		this.#buffer[11] = m34;
		this.#buffer[12] = m41;
		this.#buffer[13] = m42;
		this.#buffer[14] = m43;
		this.#buffer[15] = m44;
		return this;
	}

	copy(other: Readonly<Mat4>) {
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
			other.buffer[9],
			other.buffer[10],
			other.buffer[11],
			other.buffer[12],
			other.buffer[13],
			other.buffer[14],
			other.buffer[15],
		);
	}

	mul(other: Readonly<Mat4>) {
		const a11 = this.#buffer[0];
		const a12 = this.#buffer[4];
		const a13 = this.#buffer[8];
		const a14 = this.#buffer[12];
		const a21 = this.#buffer[1];
		const a22 = this.#buffer[5];
		const a23 = this.#buffer[9];
		const a24 = this.#buffer[13];
		const a31 = this.#buffer[2];
		const a32 = this.#buffer[6];
		const a33 = this.#buffer[10];
		const a34 = this.#buffer[14];
		const a41 = this.#buffer[3];
		const a42 = this.#buffer[7];
		const a43 = this.#buffer[11];
		const a44 = this.#buffer[15];
		const b11 = other.buffer[0];
		const b12 = other.buffer[4];
		const b13 = other.buffer[8];
		const b14 = other.buffer[12];
		const b21 = other.buffer[1];
		const b22 = other.buffer[5];
		const b23 = other.buffer[9];
		const b24 = other.buffer[13];
		const b31 = other.buffer[2];
		const b32 = other.buffer[6];
		const b33 = other.buffer[10];
		const b34 = other.buffer[14];
		const b41 = other.buffer[3];
		const b42 = other.buffer[7];
		const b43 = other.buffer[11];
		const b44 = other.buffer[15];

		this.#buffer[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
		this.#buffer[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
		this.#buffer[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
		this.#buffer[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
		this.#buffer[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
		this.#buffer[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
		this.#buffer[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
		this.#buffer[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
		this.#buffer[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
		this.#buffer[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
		this.#buffer[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
		this.#buffer[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
		this.#buffer[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
		this.#buffer[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
		this.#buffer[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
		this.#buffer[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

		return this;
	}

	determinant() {
		const n11 = this.#buffer[0];
		const n12 = this.#buffer[1];
		const n13 = this.#buffer[2];
		const n14 = this.#buffer[3];
		const n21 = this.#buffer[4];
		const n22 = this.#buffer[5];
		const n23 = this.#buffer[6];
		const n24 = this.#buffer[7];
		const n31 = this.#buffer[8];
		const n32 = this.#buffer[9];
		const n33 = this.#buffer[10];
		const n34 = this.#buffer[11];
		const n41 = this.#buffer[12];
		const n42 = this.#buffer[13];
		const n43 = this.#buffer[14];
		const n44 = this.#buffer[15];
		return (
			n41 *
				(+n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34) +
			n42 *
				(+n11 * n23 * n34 - n11 * n24 * n33 + n14 * n21 * n33 - n13 * n21 * n34 + n13 * n24 * n31 - n14 * n23 * n31) +
			n43 *
				(+n11 * n24 * n32 - n11 * n22 * n34 - n14 * n21 * n32 + n12 * n21 * n34 + n14 * n22 * n31 - n12 * n24 * n31) +
			n44 * (-n13 * n22 * n31 - n11 * n23 * n32 + n11 * n22 * n33 + n13 * n21 * n32 - n12 * n21 * n33 + n12 * n23 * n31)
		);
	}

	transpose() {
		let tmp = 0;
		tmp = this.#buffer[1];
		this.#buffer[1] = this.#buffer[4];
		this.#buffer[4] = tmp;
		tmp = this.#buffer[2];
		this.#buffer[2] = this.#buffer[8];
		this.#buffer[8] = tmp;
		tmp = this.#buffer[6];
		this.#buffer[6] = this.#buffer[9];
		this.#buffer[9] = tmp;
		tmp = this.#buffer[2];
		this.#buffer[2] = this.#buffer[8];
		this.#buffer[8] = tmp;
		tmp = this.#buffer[7];
		this.#buffer[7] = this.#buffer[13];
		this.#buffer[13] = tmp;
		tmp = this.#buffer[11];
		this.#buffer[11] = this.#buffer[14];
		this.#buffer[14] = tmp;
		return this;
	}

	position(position: Readonly<Vec3>) {
		this.#buffer[12] = position.x;
		this.#buffer[13] = position.y;
		this.#buffer[14] = position.z;
		return this;
	}

	scale(scale: Readonly<Vec3>) {
		this.#buffer[0] *= scale.x;
		this.#buffer[4] *= scale.y;
		this.#buffer[8] *= scale.z;
		this.#buffer[1] *= scale.x;
		this.#buffer[5] *= scale.y;
		this.#buffer[9] *= scale.z;
		this.#buffer[2] *= scale.x;
		this.#buffer[6] *= scale.y;
		this.#buffer[10] *= scale.z;
		this.#buffer[3] *= scale.x;
		this.#buffer[7] *= scale.y;
		this.#buffer[11] *= scale.z;
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
		this.#buffer[9] *= -1;
		this.#buffer[10] *= -1;
		this.#buffer[11] *= -1;
		this.#buffer[12] *= -1;
		this.#buffer[13] *= -1;
		this.#buffer[14] *= -1;
		this.#buffer[15] *= -1;
		return this;
	}

	inverse(other: Readonly<Mat4>) {
		const n11 = other.buffer[0];
		const n21 = other.buffer[4];
		const n31 = other.buffer[8];
		const n41 = other.buffer[12];
		const n12 = other.buffer[1];
		const n22 = other.buffer[5];
		const n32 = other.buffer[9];
		const n42 = other.buffer[13];
		const n13 = other.buffer[2];
		const n23 = other.buffer[6];
		const n33 = other.buffer[10];
		const n43 = other.buffer[14];
		const n14 = other.buffer[3];
		const n24 = other.buffer[7];
		const n34 = other.buffer[11];
		const n44 = other.buffer[15];
		const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
		const t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
		const t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
		const t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
		const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

		if (det === 0) {
			return this.makeIdentity();
		}

		const detInv = 1 / det;
		this.#buffer[0] = t11 * detInv;
		this.#buffer[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) *
			detInv;
		this.#buffer[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) *
			detInv;
		this.#buffer[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) *
			detInv;

		this.#buffer[4] = t12 * detInv;
		this.#buffer[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) *
			detInv;
		this.#buffer[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) *
			detInv;
		this.#buffer[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) *
			detInv;

		this.#buffer[8] = t13 * detInv;
		this.#buffer[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) *
			detInv;
		this.#buffer[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) *
			detInv;
		this.#buffer[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) *
			detInv;

		this.#buffer[12] = t14 * detInv;
		this.#buffer[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) *
			detInv;
		this.#buffer[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) *
			detInv;
		this.#buffer[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) *
			detInv;
		return this;
	}

	compose(
		position: Readonly<Vec3>,
		rotation: Readonly<Quaternion>,
		scale: Readonly<Vec3>,
	) {
		const x = rotation.x;
		const y = rotation.y;
		const z = rotation.z;
		const w = rotation.w;
		const x2 = x + x;
		const y2 = y + y;
		const z2 = z + z;
		const xx = x * x2;
		const xy = x * y2;
		const xz = x * z2;
		const yy = y * y2;
		const yz = y * z2;
		const zz = z * z2;
		const wx = w * x2;
		const wy = w * y2;
		const wz = w * z2;

		const px = position.x;
		const py = position.y;
		const pz = position.z;
		const sx = scale.x;
		const sy = scale.y;
		const sz = scale.z;

		this.#buffer[0] = (1 - (yy + zz)) * sx;
		this.#buffer[1] = (xy + wz) * sx;
		this.#buffer[2] = (xz - wy) * sx;
		this.#buffer[3] = 0;

		this.#buffer[4] = (xy - wz) * sy;
		this.#buffer[5] = (1 - (xx + zz)) * sy;
		this.#buffer[6] = (yz + wx) * sy;
		this.#buffer[7] = 0;

		this.#buffer[8] = (xz + wy) * sz;
		this.#buffer[9] = (yz - wx) * sz;
		this.#buffer[10] = (1 - (xx + yy)) * sz;
		this.#buffer[11] = 0;

		this.#buffer[12] = px;
		this.#buffer[13] = py;
		this.#buffer[14] = pz;
		this.#buffer[15] = 1;

		return this;
	}

	decompose(position: Vec3, rotation: Quaternion, scale: Vec3, mat4: Readonly<Mat4>) {
		const det = mat4.determinant();

		const sx = tv0.set(mat4.buffer[0], mat4.buffer[1], mat4.buffer[2]).length() * (det < 0 ? -1 : 1);
		const sy = tv0.set(mat4.buffer[4], mat4.buffer[5], mat4.buffer[6]).length();
		const sz = tv0.set(mat4.buffer[8], mat4.buffer[9], mat4.buffer[10]).length();

		position.x = mat4.buffer[12];
		position.y = mat4.buffer[13];
		position.z = mat4.buffer[14];

		tm0.copy(mat4);

		const invSX = 1 / sx;
		const invSY = 1 / sy;
		const invSZ = 1 / sz;

		tm0.buffer[0] *= invSX;
		tm0.buffer[1] *= invSX;
		tm0.buffer[2] *= invSX;

		tm0.buffer[4] *= invSY;
		tm0.buffer[5] *= invSY;
		tm0.buffer[6] *= invSY;

		tm0.buffer[8] *= invSZ;
		tm0.buffer[9] *= invSZ;
		tm0.buffer[10] *= invSZ;

		rotation.setFromRotationMat4(tm0);

		scale.x = sx;
		scale.y = sy;
		scale.z = sz;
	}

	makeTranslation(x: number, y: number, z: number) {
		return this.set(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1);
	}

	makeRotationX(theta: number) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);
		return this.set(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1);
	}

	makeRotationY(theta: number) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);
		return this.set(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1);
	}

	makeRotationZ(theta: number) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);
		return this.set(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}

	makeRotationAxis(axis: Readonly<Vec3>, angle: number) {
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		const t = 1 - c;
		const x = axis.x;
		const y = axis.y;
		const z = axis.z;
		const tx = t * x;
		const ty = t * y;
		return this.set(
			tx * x + c,
			tx * y - s * z,
			tx * z + s * y,
			0,
			tx * y + s * z,
			ty * y + c,
			ty * z - s * x,
			0,
			tx * z - s * y,
			ty * z + s * x,
			t * z * z + c,
			0,
			0,
			0,
			0,
			1,
		);
	}

	makeTranslationFromVec3(vec3: Readonly<Vec3>) {
		return this.compose(vec3, Quaternion.IDENTITY, Vec3.ONE);
	}

	makeRotationFromQuaternion(quaternion: Readonly<Quaternion>) {
		return this.compose(Vec3.ZERO, quaternion, Vec3.ONE);
	}

	makeRotationFromEuler(euler: Readonly<Euler>) {
		return this.compose(Vec3.ZERO, tq0.setFromEuler(euler), Vec3.ONE);
	}

	makeScaleFromVec3(vec3: Readonly<Vec3>) {
		return this.compose(Vec3.ZERO, Quaternion.IDENTITY, vec3);
	}

	makeScale(x: number, y: number, z: number) {
		return this.set(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1);
	}

	makeShear(x: number, y: number, z: number) {
		return this.set(1, y, z, 0, x, 1, z, 0, x, y, 1, 0, 0, 0, 0, 1);
	}

	makePerspective(left: number, right: number, top: number, bottom: number, near: number, far: number) {
		const x = (2 * near) / (right - left);
		const y = (2 * near) / (top - bottom);
		const a = (right + left) / (right - left);
		const b = (top + bottom) / (top - bottom);
		const c = -(far + near) / (far - near);
		const d = (-2 * far * near) / (far - near);
		this.#buffer[0] = x;
		this.#buffer[4] = 0;
		this.#buffer[8] = a;
		this.#buffer[12] = 0;
		this.#buffer[1] = 0;
		this.#buffer[5] = y;
		this.#buffer[9] = b;
		this.#buffer[13] = 0;
		this.#buffer[2] = 0;
		this.#buffer[6] = 0;
		this.#buffer[10] = c;
		this.#buffer[14] = d;
		this.#buffer[3] = 0;
		this.#buffer[7] = 0;
		this.#buffer[11] = -1;
		this.#buffer[15] = 0;
		return this;
	}

	makeOrthographic(left: number, right: number, top: number, bottom: number, near: number, far: number) {
		const w = 1.0 / (right - left);
		const h = 1.0 / (top - bottom);
		const p = 1.0 / (far - near);
		const x = (right + left) * w;
		const y = (top + bottom) * h;
		const z = (far + near) * p;
		this.#buffer[0] = 2 * w;
		this.#buffer[4] = 0;
		this.#buffer[8] = 0;
		this.#buffer[12] = -x;
		this.#buffer[1] = 0;
		this.#buffer[5] = 2 * h;
		this.#buffer[9] = 0;
		this.#buffer[13] = -y;
		this.#buffer[2] = 0;
		this.#buffer[6] = 0;
		this.#buffer[10] = -2 * p;
		this.#buffer[14] = -z;
		this.#buffer[3] = 0;
		this.#buffer[7] = 0;
		this.#buffer[11] = 0;
		this.#buffer[15] = 1;
		return this;
	}

	lookAt(origin: Readonly<Vec3>, forward: Readonly<Vec3>, up: Readonly<Vec3>) {
		tv0.copy(origin).sub(forward);

		// origin and forward are in the same position
		if (tv0.lengthSquared() === 0) {
			tv0.z = 1;
		}

		tv0.normalize();
		tv1.copy(up).cross(tv0);

		// up and tv0 are parallel
		if (tv1.lengthSquared() === 0) {
			tv0.z += Math.abs(up.z) === 1 ? 0.0001 : -0.0001;
			tv0.normalize();
			tv1.copy(up).cross(tv0);
		}

		tv1.normalize();
		tv2.copy(tv0).cross(tv1);

		this.#buffer[0] = tv1.x;
		this.#buffer[1] = tv1.y;
		this.#buffer[2] = tv1.z;
		this.#buffer[4] = tv2.x;
		this.#buffer[5] = tv2.y;
		this.#buffer[6] = tv2.z;
		this.#buffer[8] = tv0.x;
		this.#buffer[9] = tv0.y;
		this.#buffer[10] = tv0.z;
		return this;
	}
}

const tv0: Vec3 = new Vec3();
const tv1: Vec3 = new Vec3();
const tv2: Vec3 = new Vec3();
const tq0: Quaternion = new Quaternion();
const tm0: Mat4 = new Mat4();
