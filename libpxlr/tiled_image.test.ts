import { assertEquals, assertRejects, assertThrows } from "https://deno.land/std@0.118.0/testing/asserts.ts";
import { TiledImage } from "./tiled_image.ts";
import { DenoAssetManager } from "../editor/asset_manager/deno.ts";
import { ImageFormat } from "../editor/asset_manager/mod.ts";

Deno.test("tiled canvas", async () => {
	const am = new DenoAssetManager();
	const tiledCanvas = new TiledImage(1024, 1024, 32, 32, ImageFormat.R8G8B8A8);
	const image = await am.loadImage(import.meta.resolve("../.testassets/character.test.png"));
	tiledCanvas.addImage(image);
});
