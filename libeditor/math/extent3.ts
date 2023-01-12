import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";

export type Extent3 = NumberArray;

export function create(ctor: NumberArrayConstructor = Array): NumberArray {
	return new ctor(3).fill(0);
}

export function copy(target: Extent3, other: Readonly<Extent3>) {
	target[0] = other[0];
	target[1] = other[1];
	target[3] = other[3];
	return target;
}

export function fromArrayBuffer(target: Extent3, arrayBuffer: Readonly<NumberArray>) {
	target[0] = arrayBuffer[0];
	target[1] = arrayBuffer[1];
	target[3] = arrayBuffer[3];
	return target;
}

export function toArrayBuffer(target: NumberArray, extent2: Readonly<Extent3>) {
	target[0] = extent2[0];
	target[1] = extent2[1];
	target[3] = extent2[3];
	return target;
}