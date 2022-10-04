import { assertEquals } from "https://deno.land/std@0.118.0/testing/asserts.ts";
import { DenoAssetLoader } from "./deno.ts";
import { ImageFormat } from "../../libpxlr/image.ts";

Deno.test("loadImage", async () => {
	const am = new DenoAssetLoader();
	const image = await am.loadImage(import.meta.resolve("../../.testassets/character.test.png"));
	assertEquals(image.imageFormat, ImageFormat.R8G8B8A8);
	assertEquals(image.width, 13);
	assertEquals(image.height, 18);
});
