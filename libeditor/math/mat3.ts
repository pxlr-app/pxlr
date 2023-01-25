import { NumberArray, NumberArrayConstructor } from "./arraylike.ts";

export type Mat3 = NumberArray;

export const IDENTITY: Readonly<Mat3> = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function create(ctor: NumberArrayConstructor = Array) {
	return new ctor(9).fill(0);
}

export function copy(target: Mat3, other: Readonly<Mat3>) {
	target[0] = other[0];
	target[1] = other[1];
	target[2] = other[2];
	target[3] = other[3];
	target[4] = other[4];
	target[5] = other[5];
	target[6] = other[6];
	target[7] = other[7];
	target[8] = other[8];
	return target;
}

export function fromArrayBuffer(target: Mat3, arrayBuffer: Readonly<NumberArray>) {
	target[0] = arrayBuffer[0];
	target[1] = arrayBuffer[1];
	target[2] = arrayBuffer[2];
	target[3] = arrayBuffer[3];
	target[4] = arrayBuffer[4];
	target[5] = arrayBuffer[5];
	target[6] = arrayBuffer[6];
	target[7] = arrayBuffer[7];
	target[8] = arrayBuffer[8];
	return target;
}

export function toArrayBuffer(target: NumberArray, mat3: Readonly<Mat3>) {
	target[0] = mat3[0];
	target[1] = mat3[1];
	target[2] = mat3[2];
	target[3] = mat3[3];
	target[4] = mat3[4];
	target[5] = mat3[5];
	target[6] = mat3[6];
	target[7] = mat3[7];
	target[8] = mat3[8];
	return target;
}

export function makeIdentity(target: Mat3) {
	target[0] = 1;
	target[1] = 0;
	target[2] = 0;
	target[3] = 0;
	target[4] = 1;
	target[5] = 0;
	target[6] = 0;
	target[7] = 0;
	target[8] = 1;
	return target;
}

export function mul(target: Mat3, other: Readonly<Mat3>) {
	const a11 = target[0];
	const a12 = target[1];
	const a13 = target[2];
	const a21 = target[3];
	const a22 = target[4];
	const a23 = target[5];
	const a31 = target[6];
	const a32 = target[7];
	const a33 = target[8];
	const b11 = other[0];
	const b12 = other[1];
	const b13 = other[2];
	const b21 = other[3];
	const b22 = other[4];
	const b23 = other[5];
	const b31 = other[6];
	const b32 = other[7];
	const b33 = other[8];

	target[0] = a11 * b11 + a12 * b21 + a13 * b31;
	target[3] = a11 * b12 + a12 * b22 + a13 * b32;
	target[6] = a11 * b13 + a12 * b23 + a13 * b33;
	target[1] = a21 * b11 + a22 * b21 + a23 * b31;
	target[4] = a21 * b12 + a22 * b22 + a23 * b32;
	target[7] = a21 * b13 + a22 * b23 + a23 * b33;
	target[2] = a31 * b11 + a32 * b21 + a33 * b31;
	target[5] = a31 * b12 + a32 * b22 + a33 * b32;
	target[8] = a31 * b13 + a32 * b23 + a33 * b33;
	return target;
}

export function determinant(mat4: Readonly<Mat3>) {
	const a = mat4[0];
	const b = mat4[1];
	const c = mat4[2];
	const d = mat4[3];
	const e = mat4[4];
	const f = mat4[5];
	const g = mat4[6];
	const h = mat4[7];
	const i = mat4[8];
	return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
}

export function transpose(target: Mat3) {
	let tmp = 0;
	tmp = target[1];
	target[1] = target[3];
	target[3] = tmp;
	tmp = target[2];
	target[2] = target[6];
	target[6] = tmp;
	tmp = target[5];
	target[5] = target[7];
	target[7] = tmp;
	return target;
}

export function scale(target: Mat3, x: number, y: number) {
	target[0] *= x;
	target[1] *= y;
	target[3] *= x;
	target[4] *= y;
	target[6] *= x;
	target[7] *= y;
	return target;
}

export function rotate(target: Mat3, theta: number) {
	const c = Math.cos(theta);
	const s = Math.sin(theta);
	target[0] = c * target[0] + s * target[3];
	target[1] = -s * target[0] + c * target[3];
	target[3] = c * target[1] + s * target[4];
	target[4] = -s * target[1] + c * target[4];
	target[6] = c * target[2] + s * target[5];
	target[7] = -s * target[2] + c * target[5];
	return target;
}

export function translate(target: Mat3, x: number, y: number) {
	target[0] += x * target[2];
	target[3] += x * target[5];
	target[6] += x * target[8];
	target[1] += y * target[2];
	target[4] += y * target[5];
	target[7] += y * target[8];
	return target;
}

export function negate(target: Mat3) {
	target[0] *= -1;
	target[1] *= -1;
	target[2] *= -1;
	target[3] *= -1;
	target[4] *= -1;
	target[5] *= -1;
	target[6] *= -1;
	target[7] *= -1;
	target[8] *= -1;
	return target;
}
