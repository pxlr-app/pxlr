import { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import * as Vec3 from "./vec3.ts";

export type Mat4 = NumberArray;

export const IDENTITY: Readonly<Mat4> = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function create(ctor: NumberArrayConstructor = Array) {
	return new ctor(16).fill(0);
}

export function copy(target: Mat4, other: Readonly<Mat4>) {
	target[0] = other[0];
	target[1] = other[1];
	target[2] = other[2];
	target[3] = other[3];
	target[4] = other[4];
	target[5] = other[5];
	target[6] = other[6];
	target[7] = other[7];
	target[8] = other[8];
	target[9] = other[9];
	target[10] = other[10];
	target[11] = other[11];
	target[12] = other[12];
	target[13] = other[13];
	target[14] = other[14];
	target[15] = other[15];
	return target;
}

export function fromArrayBuffer(target: Mat4, arrayBuffer: Readonly<NumberArray>) {
	target[0] = arrayBuffer[0];
	target[1] = arrayBuffer[1];
	target[2] = arrayBuffer[2];
	target[3] = arrayBuffer[3];
	target[4] = arrayBuffer[4];
	target[5] = arrayBuffer[5];
	target[6] = arrayBuffer[6];
	target[7] = arrayBuffer[7];
	target[8] = arrayBuffer[8];
	target[9] = arrayBuffer[9];
	target[10] = arrayBuffer[10];
	target[11] = arrayBuffer[11];
	target[12] = arrayBuffer[12];
	target[13] = arrayBuffer[13];
	target[14] = arrayBuffer[14];
	target[15] = arrayBuffer[15];
	return target;
}

export function toArrayBuffer(target: NumberArray, mat4: Readonly<Mat4>) {
	target[0] = mat4[0];
	target[1] = mat4[1];
	target[2] = mat4[2];
	target[3] = mat4[3];
	target[4] = mat4[4];
	target[5] = mat4[5];
	target[6] = mat4[6];
	target[7] = mat4[7];
	target[8] = mat4[8];
	target[9] = mat4[9];
	target[10] = mat4[10];
	target[11] = mat4[11];
	target[12] = mat4[12];
	target[13] = mat4[13];
	target[14] = mat4[14];
	target[15] = mat4[15];
	return target;
}

export function makeIdentity(target: Mat4) {
	target[0] = 1;
	target[1] = 0;
	target[2] = 0;
	target[3] = 0;
	target[4] = 0;
	target[5] = 1;
	target[6] = 0;
	target[7] = 0;
	target[8] = 0;
	target[9] = 0;
	target[10] = 1;
	target[11] = 0;
	target[12] = 0;
	target[13] = 0;
	target[14] = 0;
	target[15] = 1;
	return target;
}


export function mul(target: Mat4, other: Readonly<Mat4>) {
	const a11 = target[0];
	const a12 = target[4];
	const a13 = target[8];
	const a14 = target[12];
	const a21 = target[1];
	const a22 = target[5];
	const a23 = target[9];
	const a24 = target[13];
	const a31 = target[2];
	const a32 = target[6];
	const a33 = target[10];
	const a34 = target[14];
	const a41 = target[3];
	const a42 = target[7];
	const a43 = target[11];
	const a44 = target[15];
	const b11 = other[0];
	const b12 = other[4];
	const b13 = other[8];
	const b14 = other[12];
	const b21 = other[1];
	const b22 = other[5];
	const b23 = other[9];
	const b24 = other[13];
	const b31 = other[2];
	const b32 = other[6];
	const b33 = other[10];
	const b34 = other[14];
	const b41 = other[3];
	const b42 = other[7];
	const b43 = other[11];
	const b44 = other[15];

	target[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
	target[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
	target[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
	target[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
	target[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
	target[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
	target[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
	target[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
	target[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
	target[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
	target[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
	target[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
	target[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
	target[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
	target[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
	target[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

	return target;
}

export function determinant(mat4: Readonly<Mat4>) {
	const n11 = mat4[0];
	const n12 = mat4[1];
	const n13 = mat4[2];
	const n14 = mat4[3];
	const n21 = mat4[4];
	const n22 = mat4[5];
	const n23 = mat4[6];
	const n24 = mat4[7];
	const n31 = mat4[8];
	const n32 = mat4[9];
	const n33 = mat4[10];
	const n34 = mat4[11];
	const n41 = mat4[12];
	const n42 = mat4[13];
	const n43 = mat4[13];
	const n44 = mat4[15];
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

export function transpose(target: Mat4) {
	let tmp = 0;
	tmp = target[1];
	target[1] = target[4];
	target[4] = tmp;
	tmp = target[2];
	target[2] = target[8];
	target[8] = tmp;
	tmp = target[6];
	target[6] = target[9];
	target[9] = tmp;
	tmp = target[2];
	target[2] = target[8];
	target[8] = tmp;
	tmp = target[7];
	target[7] = target[13];
	target[13] = tmp;
	tmp = target[11];
	target[11] = target[14];
	target[14] = tmp;
	return target;
}

export function position(target: Mat4, position: Readonly<Vec3.Vec3>) {
	target[12] = position[0];
	target[13] = position[1];
	target[14] = position[2];
	return target;
}

export function scale(target: NumberArray, x: number, y = x, z = x) {
	target[0] *= x;
	target[4] *= y;
	target[8] *= z;
	target[1] *= x;
	target[5] *= y;
	target[9] *= z;
	target[2] *= x;
	target[6] *= y;
	target[10] *= z;
	target[3] *= x;
	target[7] *= y;
	target[11] *= z;
	return target;
}

export function negate(target: Mat4) {
	target[0] *= -1;
	target[1] *= -1;
	target[2] *= -1;
	target[3] *= -1;
	target[4] *= -1;
	target[5] *= -1;
	target[6] *= -1;
	target[7] *= -1;
	target[8] *= -1;
	target[9] *= -1;
	target[10] *= -1;
	target[11] *= -1;
	target[12] *= -1;
	target[13] *= -1;
	target[14] *= -1;
	target[15] *= -1;
	return target;
}

export function inverse(target: Mat4, other: Readonly<Mat4>) {
	const n11 = other[0];
	const n21 = other[4];
	const n31 = other[8];
	const n41 = other[12];
	const n12 = other[1];
	const n22 = other[5];
	const n32 = other[9];
	const n42 = other[13];
	const n13 = other[2];
	const n23 = other[6];
	const n33 = other[10];
	const n43 = other[14];
	const n14 = other[3];
	const n24 = other[7];
	const n34 = other[11];
	const n44 = other[15];
	const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
	const t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
	const t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
	const t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

	const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
	if (det === 0) {
		return makeIdentity(target);
	}

	const detInv = 1 / det;
	target[0] = t11 * detInv;
	target[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) *
		detInv;
	target[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) *
		detInv;
	target[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) *
		detInv;

	target[4] = t12 * detInv;
	target[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) *
		detInv;
	target[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) *
		detInv;
	target[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) *
		detInv;

	target[8] = t13 * detInv;
	target[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) *
		detInv;
	target[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) *
		detInv;
	target[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) *
		detInv;

	target[12] = t14 * detInv;
	target[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) *
		detInv;
	target[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) *
		detInv;
	target[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) *
		detInv;
	return target;
}

export function compose(
	target: NumberArray,
	position: Readonly<Vec3.Vec3>,
	rotation: Readonly<NumberArray>,
	scale: Readonly<Vec3.Vec3>
) {
	const x = rotation[0];
	const y = rotation[1];
	const z = rotation[2];
	const w = rotation[3];
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

	const px = position[0];
	const py = position[1];
	const pz = position[2];
	const sx = scale[0];
	const sy = scale[1];
	const sz = scale[2];

	target[0] = (1 - (yy + zz)) * sx;
	target[1] = (xy + wz) * sx;
	target[2] = (xz - wy) * sx;
	target[3] = 0;

	target[4] = (xy - wz) * sy;
	target[5] = (1 - (xx + zz)) * sy;
	target[6] = (yz + wx) * sy;
	target[7] = 0;

	target[8] = (xz + wy) * sz;
	target[9] = (yz - wx) * sz;
	target[10] = (1 - (xx + yy)) * sz;
	target[11] = 0;

	target[12] = px;
	target[13] = py;
	target[14] = pz;
	target[15] = 1;

	return target;
}

// export function decompose(position: NumberArray, rotation: NumberArray, scale: NumberArray, mat4: Readonly<NumberArray>) {
// 	const det = determinant(mat4);

// 	const sx = Vec3.length(copy(tv0, [mat4[0], mat4[1], mat4[2]])) * (det < 0 ? -1 : 1);
// 	const sy = Vec3.length(copy(tv0, [mat4[4], mat4[5], mat4[6]]));
// 	const sz = Vec3.length(copy(tv0, [mat4[8], mat4[9], mat4[10]]));

// 	position[0] = mat4[12];
// 	position[1] = mat4[13];
// 	position[2] = mat4[14];

// 	copy(tm0, mat4);

// 	const invSX = 1 / sx;
// 	const invSY = 1 / sy;
// 	const invSZ = 1 / sz;

// 	tm0[0] *= invSX;
// 	tm0[1] *= invSX;
// 	tm0[2] *= invSX;

// 	tm0[4] *= invSY;
// 	tm0[5] *= invSY;
// 	tm0[6] *= invSY;

// 	tm0[8] *= invSZ;
// 	tm0[9] *= invSZ;
// 	tm0[10] *= invSZ;

// 	rotation.setFromRotationMatrix(tm0);

// 	scale[0] = sx;
// 	scale[1] = sy;
// 	scale[2] = sz;
// }

export function makeTranslation(target: Mat4, x: number, y: number, z: number) {
	return copy(target, [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1]);
}

export function makeRotationX(target: Mat4, theta: number) {
	const c = Math.cos(theta);
	const s = Math.sin(theta);
	return copy(target, [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1]);
}

export function makeRotationY(target: Mat4, theta: number) {
	const c = Math.cos(theta);
	const s = Math.sin(theta);
	return copy(target, [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1]);
}

export function makeRotationZ(target: Mat4, theta: number) {
	const c = Math.cos(theta);
	const s = Math.sin(theta);
	return copy(target, [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

export function makeRotationAxis(target: Mat4, axis: Readonly<Vec3.Vec3>, angle: number) {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	const t = 1 - c;
	const x = axis[0];
	const y = axis[1];
	const z = axis[2];
	const tx = t * x;
	const ty = t * y;
	return copy(target, [
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
		1
	]);
}

// export function makeTranslationFromVec3(target: NumberArray, vector: Readonly<NumberArray>) {
// 	return compose(
// 		target,
// 		vector,
// 		Quaternion.IDENTITY,
// 		Vec3.ONE
// 	);
// }

// export function makeRotationFromQuaternion(target: NumberArray, quaternion: Readonly<NumberArray>) {
// 	return compose(
//  	target,
// 		Vec3.ZERO,
// 		quaternion,
// 		Vec3.ONE
// 	);
// }

// export function makeRotationFromEuler(target: NumberArray, euler: Readonly<NumberArray>) {
// 	return compose(
//  	target,
// 		Vec3.ZERO,
// 		tq0.setFromEuler(euler),
// 		Vec3.ONE
// 	);
// }

// export function makeScaleFromVec3(target: NumberArray, vector: Readonly<NumberArray>) {
// 	return compose(
//  	target,
// 		Vec3.ZERO,
// 		Quaternion.IDENTITY,
// 		vector
// 	);
// }

export function makeScale(target: Mat4, x: number, y: number, z: number) {
	return copy(target, [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]);
}

export function makeShear(target: Mat4, x: number, y: number, z: number) {
	return copy(target, [1, y, z, 0, x, 1, z, 0, x, y, 1, 0, 0, 0, 0, 1]);
}

export function makePerspective(target: Mat4, left: number, right: number, top: number, bottom: number, near: number, far: number) {
	const x = (2 * near) / (right - left);
	const y = (2 * near) / (top - bottom);
	const a = (right + left) / (right - left);
	const b = (top + bottom) / (top - bottom);
	const c = -(far + near) / (far - near);
	const d = (-2 * far * near) / (far - near);
	target[0] = x;
	target[4] = 0;
	target[8] = a;
	target[12] = 0;
	target[1] = 0;
	target[5] = y;
	target[9] = b;
	target[13] = 0;
	target[2] = 0;
	target[6] = 0;
	target[10] = c;
	target[14] = d;
	target[3] = 0;
	target[7] = 0;
	target[11] = -1;
	target[15] = 0;
	return target;
}

export function makeOrthographic(target: Mat4, left: number, right: number, top: number, bottom: number, near: number, far: number) {
	const w = 1.0 / (right - left);
	const h = 1.0 / (top - bottom);
	const p = 1.0 / (far - near);
	const x = (right + left) * w;
	const y = (top + bottom) * h;
	const z = (far + near) * p;
	target[0] = 2 * w;
	target[4] = 0;
	target[8] = 0;
	target[12] = -x;
	target[1] = 0;
	target[5] = 2 * h;
	target[9] = 0;
	target[13] = -y;
	target[2] = 0;
	target[6] = 0;
	target[10] = -2 * p;
	target[14] = -z;
	target[3] = 0;
	target[7] = 0;
	target[11] = 0;
	target[15] = 1;
	return target;
}

export function lookAt(target: Mat4, origin: Readonly<Vec3.Vec3>, forward: Readonly<Vec3.Vec3>, up: Readonly<Vec3.Vec3>) {
	Vec3.sub(Vec3.copy(tv0, origin), forward);

	// origin and forward are in the same position
	if (Vec3.lengthSquared(tv0) === 0) {
		tv0[2] = 1;
	}

	Vec3.normalize(tv0);
	Vec3.cross(Vec3.copy(tv1, up), tv0)

	// up and tv0 are parallel
	if (Vec3.lengthSquared(tv1) === 0) {
		tv0[2] += Math.abs(up[2]) === 1 ? 0.0001 : -0.0001;
		Vec3.normalize(tv0);
		Vec3.cross(Vec3.copy(tv1, up), tv0);
	}

	Vec3.normalize(tv1);
	Vec3.cross(Vec3.copy(tv2, tv0), tv1);

	target[0] = tv1[0];
	target[1] = tv1[1];
	target[2] = tv1[2];
	target[4] = tv2[0];
	target[5] = tv2[1];
	target[6] = tv2[2];
	target[8] = tv0[0];
	target[9] = tv0[1];
	target[10] = tv0[2];
	return target;
}

const tv0: NumberArray = [0, 0, 0];
const tv1: NumberArray = [0, 0, 0];
const tv2: NumberArray = [0, 0, 0];
// const tm0: NumberArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];