import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";

export type Extent2 = NumberArray;

export function create(ctor: NumberArrayConstructor = Array): NumberArray {
	return new ctor(2).fill(0);
}

export function copy(target: Extent2, other: Readonly<Extent2>) {
	target[0] = other[0];
	target[1] = other[1];
	return target;
}

export function fromArrayBuffer(target: Extent2, arrayBuffer: Readonly<NumberArray>) {
	target[0] = arrayBuffer[0];
	target[1] = arrayBuffer[1];
	return target;
}

export function toArrayBuffer(target: NumberArray, extent2: Readonly<Extent2>) {
	target[0] = extent2[0];
	target[1] = extent2[1];
	return target;
}
