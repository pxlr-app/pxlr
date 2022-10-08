import { assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { assertReference } from "./reference.ts";

Deno.test("Reference", async (t) => {
	await t.step("assertReference", () => {
		assertThrows(() => assertReference());
		assertThrows(() => assertReference(null));
		assertThrows(() => assertReference(false));
		assertThrows(() => assertReference(0));
		assertThrows(() => assertReference(new Date()));
		assertThrows(() => assertReference(""));
		assertThrows(() => assertReference("foo"));
		assertThrows(() => assertReference("a/b"));
		assertThrows(() => assertReference("a/b/c"));
		assertReference("refs/b/c");
	});
});
