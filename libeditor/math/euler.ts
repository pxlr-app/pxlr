import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import type { Mat3 } from "./mat3.ts";
import * as Mat4 from "./mat4.ts";
import type { Vec3 } from "./vec3.ts";
import { clamp } from "./clamp.ts";
import * as Quaternion from "./quaternion.ts";

export type Euler = NumberArray;

export enum RotationOrder {
	XYZ = 0,
	YZX = 1,
	ZXY = 2,
	XZY = 3,
	YXZ = 4,
	ZYX = 5,
};

export function create(ctor: NumberArrayConstructor = Array) {
	return new ctor(4).fill(0);
}

export function copy(target: Euler, other: Readonly<Euler>) {
	target[0] = other[0];
	target[1] = other[1];
	target[2] = other[2];
	target[3] = other[3];
	return target;
}

export function fromArrayBuffer(target: Euler, arrayBuffer: Readonly<Euler>) {
	target[0] = arrayBuffer[0];
	target[1] = arrayBuffer[1];
	target[2] = arrayBuffer[2];
	target[3] = arrayBuffer[3];
	return target;
}

export function toArrayBuffer(target: Euler, euler: Readonly<Euler>) {
	target[0] = euler[0];
	target[1] = euler[1];
	target[2] = euler[2];
	target[3] = euler[3];
	return target;
}

export function setFromRotationMatrix(target: Euler, mat4: Readonly<Mat4.Mat4>, order = RotationOrder.XYZ) {
	const m11 = mat4[0];
	const m12 = mat4[4];
	const m13 = mat4[8];
	const m21 = mat4[1];
	const m22 = mat4[5];
	const m23 = mat4[9];
	const m31 = mat4[2];
	const m32 = mat4[6];
	const m33 = mat4[10];

	if (order === RotationOrder.XYZ) {
		target[1] = Math.asin(clamp(m13, -1, 1));
		if (Math.abs(m13) < 0.99999) {
			target[0] = Math.atan2(-m23, m33);
			target[2] = Math.atan2(-m12, m11);
		} else {
			target[0] = Math.atan2(m32, m22);
			target[2] = 0;
		}
	} else if (order === RotationOrder.YXZ) {
		target[0] = Math.asin(-clamp(m23, -1, 1));

		if (Math.abs(m23) < 0.99999) {
			target[1] = Math.atan2(m13, m33);
			target[2] = Math.atan2(m21, m22);
		} else {
			target[1] = Math.atan2(-m31, m11);
			target[2] = 0;
		}
	} else if (order === RotationOrder.ZXY) {
		target[0] = Math.asin(clamp(m32, -1, 1));

		if (Math.abs(m32) < 0.99999) {
			target[1] = Math.atan2(-m31, m33);
			target[2] = Math.atan2(-m12, m22);
		} else {
			target[1] = 0;
			target[2] = Math.atan2(m21, m11);
		}
	} else if (order === RotationOrder.ZYX) {
		target[1] = Math.asin(-clamp(m31, -1, 1));

		if (Math.abs(m31) < 0.99999) {
			target[0] = Math.atan2(m32, m33);
			target[2] = Math.atan2(m21, m11);
		} else {
			target[0] = 0;
			target[2] = Math.atan2(-m12, m22);
		}
	} else if (order === RotationOrder.YZX) {
		target[2] = Math.asin(clamp(m21, -1, 1));

		if (Math.abs(m21) < 0.99999) {
			target[0] = Math.atan2(-m23, m22);
			target[1] = Math.atan2(-m31, m11);
		} else {
			target[0] = 0;
			target[1] = Math.atan2(m13, m33);
		}
	} else if (order === RotationOrder.XZY) {
		target[2] = Math.asin(-clamp(m12, -1, 1));

		if (Math.abs(m12) < 0.99999) {
			target[0] = Math.atan2(m32, m22);
			target[1] = Math.atan2(m13, m11);
		} else {
			target[0] = Math.atan2(-m23, m33);
			target[1] = 0;
		}
	}

	target[3] = order;
	return target;
}

export function setFromQuaternion(target: Euler, quaternion: Readonly<Quaternion.Quaternion>, order: RotationOrder = target[3]) {
	Mat4.makeRotationFromQuaternion(m0, quaternion);
	return setFromRotationMatrix(target, m0, order);
}

export function setFromVec3(target: Euler, vec3: Readonly<Vec3>, order: RotationOrder = target[3]) {
	copy(target, [vec3[0], vec3[1], vec3[2], order]);
	return target;
}

export function reorder(target: Euler, order = RotationOrder.XYZ) {
	Quaternion.setFromEuler(q0, target);
	return setFromQuaternion(target, q0, order);
}

const m0: NumberArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const q0: NumberArray = [0, 0, 0, 1];