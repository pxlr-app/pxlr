import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import type { Mat3 } from "./mat3.ts";
import type { Mat4 } from "./mat4.ts";
import type { Euler } from "./euler.ts";
import { RotationOrder } from "./euler.ts";

export type Quaternion = NumberArray;

export const IDENTITY: Readonly<Quaternion> = [0, 0, 0, 1];

export function create(ctor: NumberArrayConstructor = Array) {
	return new ctor(4).fill(0);
}

export function copy(target: Quaternion, other: Readonly<Quaternion>) {
	target[0] = other[0];
	target[1] = other[1];
	target[2] = other[2];
	target[3] = other[3];
	return target;
}

export function fromArrayBuffer(target: Quaternion, arrayBuffer: Readonly<Quaternion>) {
	target[0] = arrayBuffer[0];
	target[1] = arrayBuffer[1];
	target[2] = arrayBuffer[2];
	target[3] = arrayBuffer[3];
	return target;
}

export function toArrayBuffer(target: Quaternion, quaternion: Readonly<Quaternion>) {
	target[0] = quaternion[0];
	target[1] = quaternion[1];
	target[2] = quaternion[2];
	target[3] = quaternion[3];
	return target;
}

export function length(vec3: Readonly<Quaternion>) {
	return Math.sqrt(vec3[0] * vec3[0] + vec3[1] * vec3[1] + vec3[2] * vec3[2] + vec3[3] * vec3[3]);
}

export function lengthSquared(vec3: Readonly<Quaternion>) {
	return vec3[0] * vec3[0] + vec3[1] * vec3[1] + vec3[2] * vec3[2] + vec3[3] * vec3[3];
}

export function setFromEuler(target: Quaternion, euler: Readonly<Euler>) {
	const c1 = Math.cos(euler[0] / 2);
	const c2 = Math.cos(euler[1] / 2);
	const c3 = Math.cos(euler[2] / 2);
	const s1 = Math.sin(euler[0] / 2);
	const s2 = Math.sin(euler[1] / 2);
	const s3 = Math.sin(euler[2] / 2);

	if (euler[3] === RotationOrder.XYZ) {
		target[0] = s1 * c2 * c3 + c1 * s2 * s3;
		target[1] = c1 * s2 * c3 - s1 * c2 * s3;
		target[2] = c1 * c2 * s3 + s1 * s2 * c3;
		target[3] = c1 * c2 * c3 - s1 * s2 * s3;
	} else if (euler[3] === RotationOrder.YXZ) {
		target[0] = s1 * c2 * c3 + c1 * s2 * s3;
		target[1] = c1 * s2 * c3 - s1 * c2 * s3;
		target[2] = c1 * c2 * s3 - s1 * s2 * c3;
		target[3] = c1 * c2 * c3 + s1 * s2 * s3;
	} else if (euler[3] === RotationOrder.ZXY) {
		target[0] = s1 * c2 * c3 - c1 * s2 * s3;
		target[1] = c1 * s2 * c3 + s1 * c2 * s3;
		target[2] = c1 * c2 * s3 + s1 * s2 * c3;
		target[3] = c1 * c2 * c3 - s1 * s2 * s3;
	} else if (euler[3] === RotationOrder.ZYX) {
		target[0] = s1 * c2 * c3 - c1 * s2 * s3;
		target[1] = c1 * s2 * c3 + s1 * c2 * s3;
		target[2] = c1 * c2 * s3 - s1 * s2 * c3;
		target[3] = c1 * c2 * c3 + s1 * s2 * s3;
	} else if (euler[3] === RotationOrder.YZX) {
		target[0] = s1 * c2 * c3 + c1 * s2 * s3;
		target[1] = c1 * s2 * c3 + s1 * c2 * s3;
		target[2] = c1 * c2 * s3 - s1 * s2 * c3;
		target[3] = c1 * c2 * c3 - s1 * s2 * s3;
	} else if (euler[3] === RotationOrder.XZY) {
		target[0] = s1 * c2 * c3 - c1 * s2 * s3;
		target[1] = c1 * s2 * c3 - s1 * c2 * s3;
		target[2] = c1 * c2 * s3 + s1 * s2 * c3;
		target[3] = c1 * c2 * c3 + s1 * s2 * s3;
	}
	return target;
}

export function setFromRotationMat4(target: Quaternion, mat4: Readonly<Mat4>) {
	const m11 = mat4[0];
	const m12 = mat4[4];
	const m13 = mat4[8];
	const m21 = mat4[1];
	const m22 = mat4[5];
	const m23 = mat4[9];
	const m31 = mat4[2];
	const m32 = mat4[6];
	const m33 = mat4[10];

	const trace = m11 + m22 + m33;
	let s = 0;

	if (trace > 0) {
		s = 0.5 / Math.sqrt(trace + 1.0);

		target[3] = 0.25 / s;
		target[0] = (m32 - m23) * s;
		target[1] = (m13 - m31) * s;
		target[2] = (m21 - m12) * s;
	} else if (m11 > m22 && m11 > m33) {
		s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

		target[3] = (m32 - m23) / s;
		target[0] = 0.25 * s;
		target[1] = (m12 + m21) / s;
		target[2] = (m13 + m31) / s;
	} else if (m22 > m33) {
		s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

		target[3] = (m13 - m31) / s;
		target[0] = (m12 + m21) / s;
		target[1] = 0.25 * s;
		target[2] = (m23 + m32) / s;
	} else {
		s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

		target[3] = (m21 - m12) / s;
		target[0] = (m13 + m31) / s;
		target[1] = (m23 + m32) / s;
		target[2] = 0.25 * s;
	}

	return target;
}

export function normalize(target: Quaternion) {
	let len = length(target);
	if (len === 0) {
		target[0] = 0;
		target[1] = 0;
		target[2] = 0;
		target[3] = 0;
	} else {
		len = 1 / len;
		target[0] *= len;
		target[1] *= len;
		target[2] *= len;
		target[3] *= len;
	}
	return target;
}

export function inverse(target: Quaternion) {
	return conjugate(target);
}

export function conjugate(target: Quaternion) {
	target[0] = -target[0];
	target[1] = -target[1];
	target[2] = -target[2];
	return target;
}

export function dot(left: Readonly<Quaternion>, right: Readonly<Quaternion>) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2] + left[3] * right[3];
}

export function mul(target: Quaternion, other: Readonly<Quaternion>) {
	const qax = target[0];
	const qay = target[1];
	const qaz = target[2];
	const qaw = target[3];
	const qbx = other[0];
	const qby = other[1];
	const qbz = other[2];
	const qbw = other[3];
	target[0] = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
	target[1] = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
	target[2] = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
	target[3] = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
	return target;
}