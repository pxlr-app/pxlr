import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/index";
import { autoid } from "../autoid";
import { Object } from "./object";

Deno.test("Object", async (t) => {
	await t.step("serialize and deserialize", async () => {
		const obj1 = new Object(autoid(), autoid(), "foo");
		const buf = new Buffer();
		await obj1.serialize(buf.writable);
		const obj2 = await Object.deserialize(buf.readable);
		assertEquals(obj2.id, obj1.id);
		assertEquals(obj2.headers.get("kind"), obj1.headers.get("kind"));
	});
});
