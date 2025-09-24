import type { NumberArray, NumberArrayConstructor } from "./arraylike.ts";
import { Mat4, ReadonlyMat4 } from "./mat4.ts";
import { Euler, ReadonlyEuler, RotationOrder } from "./euler.ts";

export class Quaternion {
	static IDENTITY: ReadonlyQuaternion = new Quaternion(0, 0, 0, 1);

	#buffer: NumberArray;
	constructor(buffer: NumberArray);
	constructor(x?: number, y?: number, z?: number, w?: number, ctor?: NumberArrayConstructor);
	constructor(buffer_or_x: NumberArray | number = 0, y = 0, z = 0, w = 1, ctor: NumberArrayConstructor = Array) {
		if (typeof buffer_or_x === "number") {
			let x = buffer_or_x;
			this.#buffer = new ctor(4);
			this.set(x, y, z, w);
		} else {
			this.#buffer = buffer_or_x;
		}
	}

	get buffer() {
		return this.#buffer;
	}

	get x() {
		return this.#buffer[0];
	}

	set x(value: number) {
		this.set(value, this.y, this.z, this.w);
	}

	get y() {
		return this.#buffer[1];
	}

	set y(value: number) {
		this.set(this.x, value, this.z, this.w);
	}

	get z() {
		return this.#buffer[2];
	}

	set z(value: number) {
		this.set(this.x, this.y, value, this.w);
	}

	get w() {
		return this.#buffer[3];
	}

	set w(value: number) {
		this.set(this.x, this.y, this.z, value);
	}

	set(x: number, y: number, z: number, w: number) {
		this.#buffer[0] = x;
		this.#buffer[1] = y;
		this.#buffer[2] = z;
		this.#buffer[3] = w;
		return this;
	}

	copy(other: ReadonlyQuaternion) {
		return this.set(other.buffer[0], other.buffer[1], other.buffer[2], other.buffer[3]);
	}

	setFromEuler(euler: ReadonlyEuler) {
		const c1 = Math.cos(euler.x / 2);
		const c2 = Math.cos(euler.y / 2);
		const c3 = Math.cos(euler.z / 2);
		const s1 = Math.sin(euler.x / 2);
		const s2 = Math.sin(euler.y / 2);
		const s3 = Math.sin(euler.z / 2);

		if (euler.order === RotationOrder.XYZ) {
			this.#buffer[0] = s1 * c2 * c3 + c1 * s2 * s3;
			this.#buffer[1] = c1 * s2 * c3 - s1 * c2 * s3;
			this.#buffer[2] = c1 * c2 * s3 + s1 * s2 * c3;
			this.#buffer[3] = c1 * c2 * c3 - s1 * s2 * s3;
		} else if (euler.order === RotationOrder.YXZ) {
			this.#buffer[0] = s1 * c2 * c3 + c1 * s2 * s3;
			this.#buffer[1] = c1 * s2 * c3 - s1 * c2 * s3;
			this.#buffer[2] = c1 * c2 * s3 - s1 * s2 * c3;
			this.#buffer[3] = c1 * c2 * c3 + s1 * s2 * s3;
		} else if (euler.order === RotationOrder.ZXY) {
			this.#buffer[0] = s1 * c2 * c3 - c1 * s2 * s3;
			this.#buffer[1] = c1 * s2 * c3 + s1 * c2 * s3;
			this.#buffer[2] = c1 * c2 * s3 + s1 * s2 * c3;
			this.#buffer[3] = c1 * c2 * c3 - s1 * s2 * s3;
		} else if (euler.order === RotationOrder.ZYX) {
			this.#buffer[0] = s1 * c2 * c3 - c1 * s2 * s3;
			this.#buffer[1] = c1 * s2 * c3 + s1 * c2 * s3;
			this.#buffer[2] = c1 * c2 * s3 - s1 * s2 * c3;
			this.#buffer[3] = c1 * c2 * c3 + s1 * s2 * s3;
		} else if (euler.order === RotationOrder.YZX) {
			this.#buffer[0] = s1 * c2 * c3 + c1 * s2 * s3;
			this.#buffer[1] = c1 * s2 * c3 + s1 * c2 * s3;
			this.#buffer[2] = c1 * c2 * s3 - s1 * s2 * c3;
			this.#buffer[3] = c1 * c2 * c3 - s1 * s2 * s3;
		} else if (euler.order === RotationOrder.XZY) {
			this.#buffer[0] = s1 * c2 * c3 - c1 * s2 * s3;
			this.#buffer[1] = c1 * s2 * c3 - s1 * c2 * s3;
			this.#buffer[2] = c1 * c2 * s3 + s1 * s2 * c3;
			this.#buffer[3] = c1 * c2 * c3 + s1 * s2 * s3;
		}
		return this;
	}

	setFromRotationMat4(mat4: ReadonlyMat4) {
		const m11 = mat4.buffer[0];
		const m12 = mat4.buffer[4];
		const m13 = mat4.buffer[8];
		const m21 = mat4.buffer[1];
		const m22 = mat4.buffer[5];
		const m23 = mat4.buffer[9];
		const m31 = mat4.buffer[2];
		const m32 = mat4.buffer[6];
		const m33 = mat4.buffer[10];

		const trace = m11 + m22 + m33;
		let s = 0;

		if (trace > 0) {
			s = 0.5 / Math.sqrt(trace + 1.0);

			this.#buffer[3] = 0.25 / s;
			this.#buffer[0] = (m32 - m23) * s;
			this.#buffer[1] = (m13 - m31) * s;
			this.#buffer[2] = (m21 - m12) * s;
		} else if (m11 > m22 && m11 > m33) {
			s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

			this.#buffer[3] = (m32 - m23) / s;
			this.#buffer[0] = 0.25 * s;
			this.#buffer[1] = (m12 + m21) / s;
			this.#buffer[2] = (m13 + m31) / s;
		} else if (m22 > m33) {
			s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

			this.#buffer[3] = (m13 - m31) / s;
			this.#buffer[0] = (m12 + m21) / s;
			this.#buffer[1] = 0.25 * s;
			this.#buffer[2] = (m23 + m32) / s;
		} else {
			s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

			this.#buffer[3] = (m21 - m12) / s;
			this.#buffer[0] = (m13 + m31) / s;
			this.#buffer[1] = (m23 + m32) / s;
			this.#buffer[2] = 0.25 * s;
		}

		return this;
	}

	length() {
		return Math.sqrt(this.lengthSquared());
	}

	lengthSquared() {
		return this.#buffer[0] * this.#buffer[0] + this.#buffer[1] * this.#buffer[1] + this.#buffer[2] * this.#buffer[2] +
			this.#buffer[3] * this.#buffer[3];
	}

	normalize() {
		let len = this.length();
		if (len === 0) {
			this.#buffer[0] = 0;
			this.#buffer[1] = 0;
			this.#buffer[2] = 0;
			this.#buffer[3] = 0;
		} else {
			len = 1 / len;
			this.#buffer[0] *= len;
			this.#buffer[1] *= len;
			this.#buffer[2] *= len;
			this.#buffer[3] *= len;
		}
		return this;
	}

	inverse() {
		return this.conjugate();
	}

	conjugate() {
		this.#buffer[0] = -this.#buffer[0];
		this.#buffer[1] = -this.#buffer[1];
		this.#buffer[2] = -this.#buffer[2];
		return this;
	}

	dot(other: ReadonlyQuaternion) {
		return this.#buffer[0] * other.buffer[0] + this.#buffer[1] * other.buffer[1] + this.#buffer[2] * other.buffer[2] +
			this.#buffer[3] * other.buffer[3];
	}

	mul(other: ReadonlyQuaternion) {
		const qax = this.#buffer[0];
		const qay = this.#buffer[1];
		const qaz = this.#buffer[2];
		const qaw = this.#buffer[3];
		const qbx = other.buffer[0];
		const qby = other.buffer[1];
		const qbz = other.buffer[2];
		const qbw = other.buffer[3];
		this.#buffer[0] = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this.#buffer[1] = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this.#buffer[2] = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this.#buffer[3] = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
		return this;
	}

	mulScalar(s: number) {
		this.#buffer[0] *= s;
		this.#buffer[1] *= s;
		this.#buffer[2] *= s;
		this.#buffer[3] *= s;
		return this;
	}

	toMat4(target: Mat4 = new Mat4(this.#buffer.constructor as NumberArrayConstructor)) {
		const x = this.#buffer[0],
			y = this.#buffer[1],
			z = this.#buffer[2],
			w = this.#buffer[3];
		const x2 = x + x,
			y2 = y + y,
			z2 = z + z;
		const xx = x * x2,
			xy = x * y2,
			xz = x * z2;
		const yy = y * y2,
			yz = y * z2,
			zz = z * z2;
		const wx = w * x2,
			wy = w * y2,
			wz = w * z2;

		const out = target.buffer;
		out[0] = 1 - (yy + zz);
		out[1] = xy + wz;
		out[2] = xz - wy;
		out[3] = 0;

		out[4] = xy - wz;
		out[5] = 1 - (xx + zz);
		out[6] = yz + wx;
		out[7] = 0;

		out[8] = xz + wy;
		out[9] = yz - wx;
		out[10] = 1 - (xx + yy);
		out[11] = 0;

		out[12] = 0;
		out[13] = 0;
		out[14] = 0;
		out[15] = 1;

		return target;
	}

	toEuler(target: Euler, order = RotationOrder.XYZ) {
		// deno-fmt-ignore
		const x = this.#buffer[0], y = this.#buffer[1], z = this.#buffer[2], w = this.#buffer[3];
		const x2 = x + x, y2 = y + y, z2 = z + z;
		const xx = x * x2, xy = x * y2, xz = x * z2;
		const yy = y * y2, yz = y * z2, zz = z * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;

		if (order === RotationOrder.XYZ) {
			target.y = Math.asin(Math.min(Math.max(xz - wy, -1), 1));

			if (Math.abs(xz - wy) < 0.99999) {
				target.x = Math.atan2(xy + wz, 1 - (xx + yy));
				target.z = Math.atan2(xz + wy, 1 - (xx + zz));
			} else {
				target.x = Math.atan2(-yz + wx, 1 - (yy + zz));
				target.z = 0;
			}
		} else if (order === RotationOrder.YXZ) {
			target.x = Math.asin(Math.min(Math.max(-xz - wy, -1), 1));

			if (Math.abs(-xz - wy) < 0.99999) {
				target.y = Math.atan2(xy - wz, 1 - (xx + zz));
				target.z = Math.atan2(yz - wx, 1 - (yy + zz));
			} else {
				target.y = Math.atan2(xz + wy, 1 - (xx + yy));
				target.z = 0;
			}
		} else if (order === RotationOrder.ZXY) {
			target.x = Math.asin(Math.min(Math.max(yz + wx, -1), 1));

			if (Math.abs(yz + wx) < 0.99999) {
				target.y = Math.atan2(-xz + wy, 1 - (xx + zz));
				target.z = Math.atan2(-xy + wz, 1 - (yy + zz));
			} else {
				target.y = 0;
				target.z = Math.atan2(xy + wz, 1 - (xx + yy));
			}
		} else if (order === RotationOrder.ZYX) {
			target.y = Math.asin(Math.min(Math.max(-xy + wz, -1), 1));

			if (Math.abs(-xy + wz) < 0.99999) {
				target.x = Math.atan2(xz + wy, 1 - (yy + zz));
				target.z = Math.atan2(xy + wz, 1 - (xx + yy));
			} else {
				target.x = 0;
				target.z = Math.atan2(-xz + wy, 1 - (xx + zz));
			}
		} else if (order === RotationOrder.YZX) {
			target.z = Math.asin(Math.min(Math.max(xy + wz, -1), 1));

			if (Math.abs(xy + wz) < 0.99999) {
				target.x = Math.atan2(-yz + wx, 1 - (xx + zz));
				target.y = Math.atan2(-xz + wy, 1 - (yy + zz));
			} else {
				target.x = 0;
				target.y = Math.atan2(xz + wy, 1 - (xx + yy));
			}
		} else if (order === RotationOrder.XZY) {
			target.z = Math.asin(Math.min(Math.max(-yz + wx, -1), 1));

			if (Math.abs(-yz + wx) < 0.99999) {
				target.x = Math.atan2(xz + wy, 1 - (yy + zz));
				target.y = Math.atan2(xy - wz, 1 - (xx + zz));
			} else {
				target.x = Math.atan2(-xy + wz, 1 - (xx + yy));
				target.y = 0;
			}
		}

		target.order = order;

		return target;
	}
}

export type ReadonlyQuaternion = Pick<
	Quaternion,
	"buffer" | "dot" | "length" | "lengthSquared" | "x" | "y" | "z" | "w"
>;
