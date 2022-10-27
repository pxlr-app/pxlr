import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { autoid } from "./autoid.ts";

Deno.test("AutoID", () => {
	console.log(autoid());
	console.log(autoid(0));
	console.log(autoid(autoid(0)));
	console.log(autoid(autoid(autoid(0))));
});
