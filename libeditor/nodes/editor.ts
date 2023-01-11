// import { Node } from "/libpxlr/nodes/node.ts";
import { Extent2, Mat4, Vec3 } from "../math/mod.ts";

export class EditorNode {
	#selectedTool: string;
	#viewportSize: Extent2;
	#cameraProjection: Mat4;
	#cameraPosition: Vec3;
	#cameraRotation: number;

	constructor() {
		this.#selectedTool = "pointer";
		this.#viewportSize = new Extent2(0, 0);
		this.#cameraProjection = new Mat4().makeOrthographic(-1, 1, 1, -1, -1, 1);
		this.#cameraPosition = new Vec3();
		this.#cameraRotation = 0;
	}
}
