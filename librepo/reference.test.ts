import { assertThrows } from "@std/assert";
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
