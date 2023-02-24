import { assertThrows } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { assertReferencePath } from "./reference.ts";

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
});
