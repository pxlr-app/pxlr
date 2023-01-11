export class Extent2 {
	public constructor(public width = 0, public height = 0) { }

	fromArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		this.width = arrayBuffer[0];
		this.height = arrayBuffer[1];
		return this;
	}

	toArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		arrayBuffer[0] = this.width;
		arrayBuffer[1] = this.height;
		return this;
	}

	copy(other: ReadonlyExtent2) {
		this.width = other.width;
		this.height = other.height;
		return this;
	}
}

export type ReadonlyExtent2 = Pick<Readonly<Extent2>, "width" | "height" | "toArrayBuffer">;
