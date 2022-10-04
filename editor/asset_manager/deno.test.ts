import { assertEquals, assertRejects, assertThrows } from "https://deno.land/std@0.118.0/testing/asserts.ts";
import { DenoAssetManager } from "./deno.ts";
import { ImageFormat } from "./mod.ts";

Deno.test("loadImage", async () => {
	const am = new DenoAssetManager();
	const image = await am.loadImage(import.meta.resolve("../../.testassets/character.test.png"));
	assertEquals(image.format, ImageFormat.R8G8B8A8);
	assertEquals(image.width, 13);
	assertEquals(image.height, 18);
});
