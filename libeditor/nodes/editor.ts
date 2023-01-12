// import { Node } from "/libpxlr/nodes/node.ts";
import { Extent2, Mat4, Vec3 } from "../math/mod.ts";

export class EditorNode {
	#selectedTool: string;
	#viewportSize: Extent2.Extent2;
	#cameraProjection: Mat4.Mat4;
	#cameraPosition: Vec3.Vec3;
	#cameraRotation: number;

	constructor() {
		this.#selectedTool = "pointer";
		this.#viewportSize = Extent2.create(Uint32Array);
		this.#cameraProjection = Mat4.makeOrthographic(Mat4.create(), -1, 1, 1, -1, -1, 1);
		this.#cameraPosition = Vec3.create();
		this.#cameraRotation = 0;
	}
}
