import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { ImageNode } from "./image.ts";
import { ImageLayerNode } from "./image_layer.ts";
import { ImageLayerPatchNode } from "./image_layer_patch.ts";
import { ImageChannelNode } from "./image_channel.ts";
import { Extent2, Vec2 } from "@pxlr/math";

Deno.test("ImageNode", async (t) => {
	await t.step("immutable structure", () => {
		const patch1 = ImageLayerPatchNode.new({
			position: new Vec2(0, 0),
			size: new Extent2(2, 2),
			data: new Uint8Array([1, 2, 3, 4]).buffer,
		});
		const patch2 = ImageLayerPatchNode.new({
			position: new Vec2(2, 2),
			size: new Extent2(2, 2),
			data: new Uint8Array([5, 6, 7, 8]).buffer,
		});
		const layer1 = ImageLayerNode.new({
			name: "Layer 1",
			position: new Vec2(0, 0),
			channels: {
				gray: [patch1, patch2],
			},
		});
		const channel1 = ImageChannelNode.new({
			name: "Diffuse",
			identifier: "gray",
			storageFormat: "r8uint",
			renderAs: "grayscale",
		});
		const img1 = ImageNode.new({
			name: "A",
			size: new Extent2(4, 4),
			channels: [channel1],
			layers: [layer1],
		});
		assertEquals(img1.kind, "Image");
	});
});
