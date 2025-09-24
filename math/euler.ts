import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import { Mat4 } from "./mat4.ts";
import { Quaternion } from "./quaternion.ts";
import { Vec3 } from "./vec3.ts";
import { clamp } from "./utils.ts";

export enum RotationOrder {
	XYZ = 0,
	YZX = 1,
	ZXY = 2,
	XZY = 3,
	YXZ = 4,
	ZYX = 5,
}

export class Euler {
	#buffer: NumberArray;
	#order: RotationOrder;
	constructor(buffer: NumberArray, order?: RotationOrder.XYZ);
	constructor(x?: number, y?: number, z?: number, order?: RotationOrder.XYZ, ctor?: NumberArrayConstructor);
	constructor(
		buffer_or_x: NumberArray | number = 0,
		order_or_y: RotationOrder | number = RotationOrder.XYZ,
		z = 0,
		order = RotationOrder.XYZ,
		ctor: NumberArrayConstructor = Array,
	) {
		if (typeof buffer_or_x === "number") {
			let x = buffer_or_x;
			let y = order_or_y as number;
			this.#buffer = new ctor(3);
			this.#order = order;
			this.set(x, y, z, order);
		} else {
			this.#buffer = buffer_or_x;
			this.#order = order_or_y as RotationOrder;
		}
	}

	get buffer() {
		return this.#buffer;
	}

	get x() {
		return this.#order === RotationOrder.XYZ || this.#order === RotationOrder.XZY
			? this.#buffer[0]
			: this.#order === RotationOrder.YXZ || this.#order === RotationOrder.ZXY
			? this.#buffer[1]
			: this.#buffer[2];
	}

	set x(value: number) {
		this.set(value, this.y, this.z, this.#order);
	}

	get y() {
		return this.#order === RotationOrder.XYZ || this.#order === RotationOrder.YXZ
			? this.#buffer[1]
			: this.#order === RotationOrder.XZY || this.#order === RotationOrder.YZX
			? this.#buffer[0]
			: this.#buffer[2];
	}

	set y(value: number) {
		this.set(this.x, value, this.z, this.#order);
	}

	get z() {
		return this.#order === RotationOrder.XYZ || this.#order === RotationOrder.ZXY
			? this.#buffer[2]
			: this.#order === RotationOrder.XZY || this.#order === RotationOrder.YZX
			? this.#buffer[1]
			: this.#buffer[0];
	}

	set z(value: number) {
		this.set(this.x, this.y, value, this.#order);
	}

	get order() {
		return this.#order;
	}

	set order(value: RotationOrder) {
		this.set(this.x, this.y, this.z, value);
	}

	set(x: number, y: number, z: number, order: RotationOrder = RotationOrder.XYZ) {
		// deno-fmt-ignore
		this.#buffer[0] = 
			order === RotationOrder.XYZ || order === RotationOrder.XZY ? x
			: order === RotationOrder.YXZ || order === RotationOrder.YZX ? y
			: z;
		// deno-fmt-ignore
		this.#buffer[1] =
			order === RotationOrder.XYZ || order === RotationOrder.YXZ ? y
			: order === RotationOrder.XZY || order === RotationOrder.ZXY ? z
			: x;
		// deno-fmt-ignore
		this.#buffer[2] =
			order === RotationOrder.XYZ || order === RotationOrder.ZXY ? z
			: order === RotationOrder.XZY || order === RotationOrder.YZX ? x
			: y;
		this.#order = order;
		return this;
	}

	copy(other: Readonly<Euler>) {
		this.#buffer[0] = other.buffer[0];
		this.#buffer[1] = other.buffer[1];
		this.#buffer[2] = other.buffer[2];
		this.#order = other.order;
		return this;
	}

	setFromRotationMatrix(mat4: Readonly<Mat4>, order = this.#order) {
		const m11 = mat4.buffer[0];
		const m12 = mat4.buffer[4];
		const m13 = mat4.buffer[8];
		const m21 = mat4.buffer[1];
		const m22 = mat4.buffer[5];
		const m23 = mat4.buffer[9];
		const m31 = mat4.buffer[2];
		const m32 = mat4.buffer[6];
		const m33 = mat4.buffer[10];

		if (order === RotationOrder.XYZ) {
			this.#buffer[1] = Math.asin(clamp(m13, -1, 1));
			if (Math.abs(m13) < 0.99999) {
				this.#buffer[0] = Math.atan2(-m23, m33);
				this.#buffer[2] = Math.atan2(-m12, m11);
			} else {
				this.#buffer[0] = Math.atan2(m32, m22);
				this.#buffer[2] = 0;
			}
		} else if (order === RotationOrder.YXZ) {
			this.#buffer[0] = Math.asin(-clamp(m23, -1, 1));

			if (Math.abs(m23) < 0.99999) {
				this.#buffer[1] = Math.atan2(m13, m33);
				this.#buffer[2] = Math.atan2(m21, m22);
			} else {
				this.#buffer[1] = Math.atan2(-m31, m11);
				this.#buffer[2] = 0;
			}
		} else if (order === RotationOrder.ZXY) {
			this.#buffer[0] = Math.asin(clamp(m32, -1, 1));

			if (Math.abs(m32) < 0.99999) {
				this.#buffer[1] = Math.atan2(-m31, m33);
				this.#buffer[2] = Math.atan2(-m12, m22);
			} else {
				this.#buffer[1] = 0;
				this.#buffer[2] = Math.atan2(m21, m11);
			}
		} else if (order === RotationOrder.ZYX) {
			this.#buffer[1] = Math.asin(-clamp(m31, -1, 1));

			if (Math.abs(m31) < 0.99999) {
				this.#buffer[0] = Math.atan2(m32, m33);
				this.#buffer[2] = Math.atan2(m21, m11);
			} else {
				this.#buffer[0] = 0;
				this.#buffer[2] = Math.atan2(-m12, m22);
			}
		} else if (order === RotationOrder.YZX) {
			this.#buffer[2] = Math.asin(clamp(m21, -1, 1));

			if (Math.abs(m21) < 0.99999) {
				this.#buffer[0] = Math.atan2(-m23, m22);
				this.#buffer[1] = Math.atan2(-m31, m11);
			} else {
				this.#buffer[0] = 0;
				this.#buffer[1] = Math.atan2(m13, m33);
			}
		} else if (order === RotationOrder.XZY) {
			this.#buffer[2] = Math.asin(-clamp(m12, -1, 1));

			if (Math.abs(m12) < 0.99999) {
				this.#buffer[0] = Math.atan2(m32, m22);
				this.#buffer[1] = Math.atan2(m13, m11);
			} else {
				this.#buffer[0] = Math.atan2(-m23, m33);
				this.#buffer[1] = 0;
			}
		}

		this.#order = order;
		return this;
	}

	setFromQuaternion(quaternion: Readonly<Quaternion>, order: RotationOrder = this.#buffer[3]) {
		return this.setFromRotationMatrix(new Mat4().makeRotationFromQuaternion(quaternion), order);
	}

	setFromVec3(vec3: Readonly<Vec3>, order: RotationOrder = this.#order) {
		return this.set(vec3.x, vec3.y, vec3.z, order);
	}

	reorder(order = RotationOrder.XYZ) {
		return this.setFromQuaternion(new Quaternion().setFromEuler(this), order);
	}
}

// const m0: Mat4 = new Mat4();
// const q0: Quaternion = new Quaternion();
