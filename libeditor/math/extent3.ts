export class Extent3 {
	public constructor(public width = 0, public height = 0, public depth = 0) { }

	fromArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		this.width = arrayBuffer[0];
		this.height = arrayBuffer[1];
		this.depth = arrayBuffer[2];
		return this;
	}

	toArrayBuffer(arrayBuffer: Float32Array | Float64Array) {
		arrayBuffer[0] = this.width;
		arrayBuffer[1] = this.height;
		arrayBuffer[2] = this.depth;
		return this;
	}

	copy(other: ReadonlyExtent3) {
		this.width = other.width;
		this.height = other.height;
		this.depth = other.depth;
		return this;
	}
}

export type ReadonlyExtent3 = Pick<Readonly<Extent3>, "width" | "height" | "depth" | "toArrayBuffer">;
