import { assert, assertEquals } from "@std/assert";
import { Blob } from "./blob.ts";

Deno.test("Blob", async (t) => {
	const content = new TextEncoder().encode("Hello World!");
	await t.step("create", async () => {
		const obj1 = await Blob.create("blob", content);
		assertEquals(obj1.hash, "c57eff55ebc0c54973903af5f72bac72762cf4f4");
		assertEquals(obj1.kind, "blob");
		assertEquals(obj1.content, content);
	});

	await t.step("fromArrayBuffer", async () => {
		const obj1 = await Blob.create("blob", content);
		const obj2 = await Blob.fromReadableStream(obj1.toReadableStream());
		assertEquals(obj2, obj1);
	});
});
