import { assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { Object } from "./object.ts";
import { autoid } from "./autoid.ts";

Deno.test("Object", async (t) => {
	await t.step("id must be an AutoId", () => {
		assertThrows(() => { new Object("foo", "note", new Map()) });
	});
	await t.step("serialize and deserialize", async () => {
		const obj1 = Object.new(autoid(), "note", { name: "My note" }, "My Content");
		const buf = new Buffer();
		await obj1.serialize(buf.writable);
		const obj2 = await Object.deserialize(buf.readable);
		assertEquals(obj2.id, obj1.id);
		assertEquals(obj2.type, obj1.type);
		assertEquals(obj2.headers.get('name'), obj1.headers.get('name'));
		assertEquals(await obj2.text(), await obj1.text());
	});
});