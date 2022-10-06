import { assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { AutoId, autoid } from "../autoid.ts";
import { Object } from "./object.ts";

Deno.test("Object", async (t) => {
	class DummyObject extends Object {
		static new(id: AutoId, name: string) {
			return new DummyObject(id, "dummy", new Map([["name", name]]));
		}
	}

	await t.step("id must be an AutoId", () => {
		assertThrows(() => {
			DummyObject.new("foo", "Dummy");
		});
	});
	await t.step("serialize and deserialize", async () => {
		const obj1 = DummyObject.new(autoid(), "Dummy");
		const buf = new Buffer();
		await obj1.serialize(buf.writable);
		const obj2 = await DummyObject.deserialize(buf.readable);
		assertEquals(obj2.id, obj1.id);
		assertEquals(obj2.type, obj1.type);
		assertEquals(obj2.headers.get("name"), obj1.headers.get("name"));
	});
});
