import { assertEquals } from "@std/assert";
import { Object } from "./object.ts";

Deno.test("Object", async (t) => {
	const body = new TextEncoder().encode("Hello World!");
	await t.step("create", async () => {
		const obj1 = await Object.create("blob", body);
		assertEquals(obj1.hash, "c57eff55ebc0c54973903af5f72bac72762cf4f4");
		assertEquals(obj1.kind, "blob");
		assertEquals(obj1.body, body);
	});

	await t.step("fromArrayBuffer", async () => {
		const obj1 = await Object.create("blob", body);
		const obj2 = await Object.fromArrayBuffer(obj1.toArrayBuffer());
		assertEquals(obj2.hash, obj1.hash);
		assertEquals(obj2.kind, obj1.kind);
		assertEquals(obj2.body, body);
	});
});
