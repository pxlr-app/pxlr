import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { autoid } from "../autoid.ts";
import { CommitObject, CommitObjectSerializer } from "./commit.ts";

Deno.test("CommitObject", async (t) => {
	await t.step("serialize and deserialize", async () => {
		const ser = new CommitObjectSerializer();
		const obj1 = new CommitObject(autoid(), autoid(), autoid(), "John Doe <jdoe@example.org>", new Date(), "init");
		const buf = new Buffer();
		await ser.serialize(buf.writable, obj1);
		const obj2 = await ser.deserialize(buf.readable);
		assertEquals(obj2.id, obj1.id);
		assertEquals(obj2.type, obj1.type);
		assertEquals(obj2.parent, obj1.parent);
		assertEquals(obj2.tree, obj1.tree);
		assertEquals(obj2.commiter, obj1.commiter);
		assertEquals(obj2.date, obj1.date);
		assertEquals(obj2.message, obj1.message);
	});
});
