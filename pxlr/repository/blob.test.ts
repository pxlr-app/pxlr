import { assertEquals } from "@std/assert";
import { Blob } from "./blob.ts";

Deno.test("Blob", async (t) => {
	const content = new TextEncoder().encode("Hello World!");
	await t.step("create", async () => {
		const obj1 = new Blob("blob", content);
		assertEquals(obj1.kind, "blob");
		assertEquals(obj1.content, content);
	});

	await t.step("fromArrayBuffer", async () => {
		const obj1 = new Blob("blob", content);
		const obj2 = await Blob.fromArrayBuffer(obj1.toArrayBuffer());
		assertEquals(obj2.kind, obj1.kind);
		assertEquals(obj2.content, content);
	});
});
