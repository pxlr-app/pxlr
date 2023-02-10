import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import type { Mat3 } from "./mat3.ts";

export type Vec2 = NumberArray;

export const ZERO: Readonly<Vec2> = [0, 0];
export const ONE: Readonly<Vec2> = [1, 1];
export const RIGHT: Readonly<Vec2> = [1, 0];
export const UP: Readonly<Vec2> = [0, 1];

export function create(ctor: NumberArrayConstructor = Array) {
	return new ctor(2).fill(0);
}

export function copy(target: Vec2, other: Readonly<Vec2>) {
	target[0] = other[0];
	target[1] = other[1];
	return target;
}

export function fromArrayBuffer(target: Vec2, arrayBuffer: Readonly<NumberArray>) {
	target[0] = arrayBuffer[0];
	target[1] = arrayBuffer[1];
	return target;
}

export function toArrayBuffer(target: NumberArray, vec2: Readonly<Vec2>) {
	target[0] = vec2[0];
	target[1] = vec2[1];
	return target;
}

export function length(vec2: Readonly<Vec2>) {
	return Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1]);
}

export function lengthSquared(vec2: Readonly<Vec2>) {
	return vec2[0] * vec2[0] + vec2[1] * vec2[1];
}

export function add(target: Vec2, other: Readonly<Vec2>) {
	target[0] += other[0];
	target[1] += other[1];
	return target;
}

export function sub(target: Vec2, other: Readonly<Vec2>) {
	target[0] -= other[0];
	target[1] -= other[1];
	return target;
}

export function mul(target: Vec2, other: Readonly<Vec2>) {
	target[0] *= other[0];
	target[1] *= other[1];
	return target;
}

export function mulScalar(target: Vec2, scalar: number) {
	target[0] *= scalar;
	target[1] *= scalar;
	return target;
}

export function negate(target: Vec2) {
	return mulScalar(target, -1);
}

export function mulMat3(target: Vec2, mat3: Readonly<Mat3>) {
	const x = target[0];
	const y = target[1];
	target[0] = mat3[0] * x + mat3[3] * y + mat3[6];
	target[1] = mat3[1] * x + mat3[4] * y + mat3[7];
	return target;
}

export function div(target: Vec2, other: Readonly<Vec2>) {
	target[0] /= other[0];
	target[1] /= other[1];
	return target;
}

export function divScalar(target: Vec2, scalar: number) {
	target[0] /= scalar;
	target[1] /= scalar;
	return target;
}

export function dot(left: Readonly<Vec2>, right: Readonly<Vec2>) {
	return left[0] * right[0] + left[1] * right[1];
}

export function cross(left: Readonly<Vec2>, right: Readonly<Vec2>) {
	return left[0] * right[0] - left[1] * right[1];
}

export function normalize(target: Vec2) {
	return divScalar(target, length(target));
}

export function min(target: Vec2, other: Readonly<Vec2>) {
	target[0] = Math.min(target[0], other[0]);
	target[1] = Math.min(target[1], other[1]);
	return target;
}

export function max(target: Vec2, other: Readonly<Vec2>) {
	target[0] = Math.max(target[0], other[0]);
	target[1] = Math.max(target[1], other[1]);
	return target;
}

export function clamp(target: Vec2, lower: Readonly<Vec2>, upper: Readonly<Vec2>) {
	return max(min(target, upper), lower);
}

export function clampLength(target: Vec2, lower: number, upper: number) {
	const len = length(target);
	return mulScalar(divScalar(target, len), Math.max(lower, Math.min(upper, len)));
}

export function project(target: Vec2, normal: Readonly<Vec2>) {
	return mulScalar(target, dot(target, normal) / lengthSquared(normal));
}

export function reflect(target: Vec2, normal: Readonly<Vec2>) {
	return sub(target, mulScalar(copy(tv0, normal), 2 * dot(target, normal)));
}

export function angleTo(target: Vec2, other: Readonly<Vec2>) {
	const theta = dot(target, other) / Math.sqrt(lengthSquared(target) * lengthSquared(other));
	return Math.acos(Math.min(1, Math.max(-1, theta)));
}

export function distanceToSquared(target: Vec2, other: Readonly<Vec2>) {
	return lengthSquared(sub(copy(tv0, target), other));
}

export function distanceTo(target: Vec2, other: Readonly<Vec2>) {
	return Math.sqrt(distanceToSquared(target, other));
}

const tv0: Vec2 = [0, 0];
