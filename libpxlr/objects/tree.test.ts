import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { autoid } from "../autoid.ts";
import { TreeObject, TreeObjectSerializer } from "./tree.ts";

Deno.test("TreeObject", async (t) => {
	await t.step("serialize and deserialize", async () => {
		const ser = new TreeObjectSerializer();
		const obj1 = new TreeObject(autoid(), "group", "Dummy", [{ id: autoid(), kind: "blob", name: "a" }, { id: autoid(), kind: "tree", name: "b" }, {
			id: autoid(),
			kind: "blob",
			name: "c",
		}]);
		const buf = new Buffer();
		await ser.serialize(buf.writable, obj1);
		const obj2 = await ser.deserialize(buf.readable);
		assertEquals(obj2.id, obj1.id);
		assertEquals(obj2.kind, obj1.kind);
		assertEquals(obj2.name, obj1.name);
		assertEquals(obj2.items.length, obj1.items.length);
		assertEquals(obj2.items[0].id, obj1.items[0].id);
	});
});
