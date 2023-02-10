import { assertEquals, assertThrows } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { autoid } from "../libpxlr/autoid.ts";
import { assertReferencePath, Reference } from "./reference.ts";

Deno.test("Reference", async (t) => {
	await t.step("assertReferencePath", () => {
		assertThrows(() => assertReferencePath());
		assertThrows(() => assertReferencePath(null));
		assertThrows(() => assertReferencePath(false));
		assertThrows(() => assertReferencePath(0));
		assertThrows(() => assertReferencePath(new Date()));
		assertThrows(() => assertReferencePath(""));
		assertThrows(() => assertReferencePath("foo"));
		assertReferencePath("refs/heads/main");
		assertReferencePath("refs/tags/v1");
		assertReferencePath("objects/Z/t/ZtBjcuH46AeQaczTdC12");
	});

	await t.step("serialize and deserialize", async () => {
		const ref1 = new Reference("refs/heads/main", autoid(), "foo");
		const buf = new Buffer();
		await ref1.serialize(buf.writable);
		const ref2 = await Reference.deserialize(buf.readable);
		assertEquals(ref2.ref, ref1.ref);
		assertEquals(ref2.commit, ref1.commit);
		assertEquals(ref2.message, ref1.message);
	});
});
