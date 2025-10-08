import { assert, assertEquals } from "@std/assert";
import { Blob } from "./blob.ts";

Deno.test("Blob", async (t) => {
	const content = new TextEncoder().encode("Hello World!");
	await t.step("create", async () => {
		const obj1 = Blob.create({ kind: "blob" }, content);
		assertEquals(obj1.hash, "c26515c85aede51b0483c8c64d2256205848e7f4");
		assertEquals(obj1.headers.get("kind"), "blob");
		assertEquals(obj1.content, content);
	});

	await t.step("fromArrayBuffer", async () => {
		const obj1 = Blob.create({ kind: "blob" }, content);
		const obj2 = await Blob.fromReadableStream(obj1.toReadableStream());
		assertEquals(obj2, obj1);
	});
});
