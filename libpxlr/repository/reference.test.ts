import { assertThrows } from "https://deno.land/std@0.158.0/testing/asserts.ts";
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
		assertReference("refs/heads/main");
		assertReference("refs/tags/v1");
		assertReference("objects/Z/t/ZtBjcuH46AeQaczTdC12");
	});
});
