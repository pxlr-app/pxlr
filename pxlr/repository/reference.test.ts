import { assertEquals } from "@std/assert";
import { Reference } from "./reference.ts";

Deno.test("Reference", async (t) => {
	await t.step("create", async () => {
		const ref1 = new Reference("refs/heads/main");
		const ref2 = new Reference("5f2f2163df256339cd1613702dbd590ef461e502");
		assertEquals(ref1.kind, "ref");
		assertEquals(ref2.kind, "hash");
	});

	await t.step("fromArrayBuffer", async () => {
		const ref1 = new Reference("refs/heads/main");
		const ref2 = await Reference.fromReadableStream(ref1.toReadableStream());
		assertEquals(ref1, ref2);
	});
});
