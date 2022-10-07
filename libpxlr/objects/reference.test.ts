import { assert, assertFalse } from "https://deno.land/std/testing/asserts.ts";
import { isReference } from "./reference.ts";

Deno.test("Reference", async (t) => {
	await t.step("isReference", () => {
		assertFalse(isReference());
		assertFalse(isReference(null));
		assertFalse(isReference(false));
		assertFalse(isReference(0));
		assertFalse(isReference(new Date()));
		assertFalse(isReference(""));
		assertFalse(isReference("foo"));
		assertFalse(isReference("a/b"));
		assertFalse(isReference("a/b/c"));
		assert(isReference("refs/b/c"));
	});
});
