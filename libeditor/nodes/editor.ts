// import { Node } from "/libpxlr/nodes/node.ts";
import { Extent2, Mat4, Vec2, Quaternion, Vec3, Euler } from "../math/mod.ts";

export class EditorNode {
	#selectedTool: string;
	#viewportSize: Extent2.Extent2;
	#viewportZoom: number;
	#viewportPosition: Vec2.Vec2;
	#viewportRotation: number;
	#cameraDirty: boolean;
	#cameraProjection: Mat4.Mat4;
	#cameraMatrix: Mat4.Mat4;

	constructor(width = 0, height = width, zoom = 1) {
		this.#selectedTool = "pointer";
		this.#viewportSize = new Uint32Array([width, height]);
		this.#viewportZoom = zoom;
		this.#viewportPosition = Vec2.create(Int32Array);
		this.#viewportRotation = 0;
		this.#cameraProjection = Mat4.create(Float32Array);
		this.#cameraMatrix = Mat4.create(Float32Array);
		this.#cameraDirty = true;
	}

	get width() {
		return this.#viewportSize[0];
	}
	set width(value) {
		this.#viewportSize[0] = value;
		this.#cameraDirty = true;
	}

	get height() {
		return this.#viewportSize[1];
	}
	set height(value) {
		this.#viewportSize[1] = value;
		this.#cameraDirty = true;
	}

	get zoom() {
		return this.#viewportZoom;
	}
	set zoom(value) {
		this.#viewportZoom = value;
		this.#cameraDirty = true;
	}

	get positionX() {
		return this.#viewportPosition[0];
	}
	set positionX(value) {
		this.#viewportPosition[0] = value;
		this.#cameraDirty = true;
	}

	get positionY() {
		return this.#viewportPosition[1];
	}
	set positionY(value) {
		this.#viewportPosition[1] = value;
		this.#cameraDirty = true;
	}

	#updateCameraMatrices() {
		if (this.#cameraDirty) {
			const halfWidth = this.#viewportSize[0] / 2;
			const halfHeight = this.#viewportSize[1] / 2;
			const left = -halfWidth;
			const right = +halfWidth;
			const top = -halfHeight;
			const bottom = +halfHeight;
			const dx = (right - left) / (this.#viewportZoom * 2);
			const dy = (top - bottom) / (this.#viewportZoom * 2);
			const cx = (right + left) / 2;
			const cy = (top + bottom) / 2;
			Mat4.makeOrthographic(this.#cameraProjection, cx - dx, cx + dx, cy + dy, cy - dy, -1, 1);

			e[0] = 0;
			e[1] = 0;
			e[2] = this.#viewportRotation;
			Quaternion.setFromEuler(q, e);
			Vec2.copy(v3, this.#viewportPosition);
			v3[2] = 0;
			Mat4.compose(
				this.#cameraMatrix,
				e,
				q,
				Vec3.ONE
			);

			this.#cameraDirty = false;
		}
	}
}

const e = Euler.create(Float32Array);
const v3 = Vec3.create(Float32Array);
const q = Quaternion.create(Float32Array);