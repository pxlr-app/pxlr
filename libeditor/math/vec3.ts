import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import type { Mat3 } from "./mat3.ts";
import type { Mat4 } from "./mat4.ts";

export type Vec3 = NumberArray;

export const ZERO: Readonly<Vec3> = [0, 0, 0];
export const ONE: Readonly<Vec3> = [1, 1, 1];
export const RIGHT: Readonly<Vec3> = [1, 0, 0];
export const UP: Readonly<Vec3> = [0, 1, 0];
export const FORWARD: Readonly<Vec3> = [0, 0, 1];

export function create(ctor: NumberArrayConstructor = Array) {
	return new ctor(3).fill(0);
}

export function copy(target: Vec3, other: Readonly<Vec3>) {
	target[0] = other[0];
	target[1] = other[1];
	target[2] = other[2];
	return target;
}

export function fromArrayBuffer(target: Vec3, arrayBuffer: Readonly<Vec3>) {
	target[0] = arrayBuffer[0];
	target[1] = arrayBuffer[1];
	target[2] = arrayBuffer[2];
	return target;
}

export function toArrayBuffer(target: Vec3, vec3: Readonly<Vec3>) {
	target[0] = vec3[0];
	target[1] = vec3[1];
	target[2] = vec3[2];
	return target;
}

export function length(vec2: Readonly<Vec3>) {
	return Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1] + vec2[2] * vec2[2]);
}

export function lengthSquared(vec2: Readonly<Vec3>) {
	return vec2[0] * vec2[0] + vec2[1] * vec2[1] + vec2[2] * vec2[2];
}
export function add(target: Vec3, other: Readonly<Vec3>) {
	target[0] += other[0];
	target[1] += other[1];
	target[2] += other[2];
	return target;
}

export function sub(target: Vec3, other: Readonly<Vec3>) {
	target[0] -= other[0];
	target[1] -= other[1];
	target[2] -= other[2];
	return target;
}

export function mul(target: Vec3, other: Readonly<Vec3>) {
	target[0] *= other[0];
	target[1] *= other[1];
	target[2] *= other[2];
	return target;
}

export function mulScalar(target: Vec3, scalar: number) {
	target[0] *= scalar;
	target[1] *= scalar;
	target[2] *= scalar;
	return target;
}

export function negate(target: Vec3) {
	return mulScalar(target, -1);
}

export function div(target: Vec3, other: Readonly<Vec3>) {
	target[0] /= other[0];
	target[1] /= other[1];
	target[2] /= other[2];
	return target;
}

export function divScalar(target: Vec3, scalar: number) {
	target[0] /= scalar;
	target[1] /= scalar;
	target[2] /= scalar;
	return target;
}

export function mulMat3(target: Vec3, mat3: Readonly<Mat3>) {
	const x = target[0];
	const y = target[1];
	const z = target[2];
	target[0] = mat3[0] * x + mat3[3] * y + mat3[6] * z;
	target[1] = mat3[1] * x + mat3[4] * y + mat3[7] * z;
	target[2] = mat3[2] * x + mat3[5] * y + mat3[8] * z;
	return target;
}

export function mulMat4(target: Vec3, mat4: Readonly<Mat4>) {
	const x = target[0];
	const y = target[1];
	const z = target[2];
	const w = 1 / (mat4[3] * x + mat4[7] * y + mat4[11] * z + mat4[15]);
	target[0] = (mat4[0] * x + mat4[4] * y + mat4[8] * z + mat4[12]) * w;
	target[1] = (mat4[1] * x + mat4[5] * y + mat4[9] * z + mat4[13]) * w;
	target[2] = (mat4[2] * x + mat4[6] * y + mat4[10] * z + mat4[14]) * w;
	return target;
}

export function dot(left: Readonly<Vec3>, right: Readonly<Vec3>) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

export function cross(target: Vec3, right: Readonly<Vec3>) {
	const ax = target[0];
	const bx = right[0];
	const ay = target[1];
	const by = right[1];
	const az = target[2];
	const bz = right[2];
	target[0] = ay * bz - az * by;
	target[1] = az * bx - ax * bz;
	target[2] = ax * by - ay * bx;
	return target;
}

export function normalize(target: Vec3) {
	return divScalar(target, length(target));
}

export function min(target: Vec3, other: Readonly<Vec3>) {
	target[0] = Math.min(target[0], other[0]);
	target[1] = Math.min(target[1], other[1]);
	target[2] = Math.min(target[2], other[2]);
	return target;
}

export function max(target: Vec3, other: Readonly<Vec3>) {
	target[0] = Math.max(target[0], other[0]);
	target[1] = Math.max(target[1], other[1]);
	target[2] = Math.max(target[2], other[2]);
	return target;
}

export function clamp(target: Vec3, lower: Readonly<Vec3>, upper: Readonly<Vec3>) {
	return max(min(target, upper), lower);
}

export function clampLength(target: Vec3, lower: number, upper: number) {
	const len = length(target);
	return mulScalar(divScalar(target, len), Math.max(lower, Math.min(upper, len)));
}

export function project(target: Vec3, normal: Readonly<Vec3>) {
	return mulScalar(target, dot(target, normal) / lengthSquared(normal));
}

export function reflect(target: Vec3, normal: Readonly<Vec3>) {
	return sub(target, mulScalar(copy(tv0, normal), 2 * dot(target, normal)));
}

export function angleTo(target: Vec3, other: Readonly<Vec3>) {
	const theta = dot(target, other) / Math.sqrt(lengthSquared(target) * lengthSquared(other));
	return Math.acos(Math.min(1, Math.max(-1, theta)));
}

export function distanceToSquared(target: Vec3, other: Readonly<Vec3>) {
	return lengthSquared(sub(copy(tv0, target), other));
}

export function distanceTo(target: Vec3, other: Readonly<Vec3>) {
	return Math.sqrt(distanceToSquared(target, other));
}

const tv0: Vec3 = [0, 0, 0];
