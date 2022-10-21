import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { Lock } from "./lock.ts";

Deno.test("Lock", async () => {

	const l1 = new Lock();
	assertEquals(l1.isFree, true);

	let lastId = 0;
	const locks = new Array(10).fill(0).map((_, i) => l1.acquire().then(r => {
		assertEquals(lastId, i);
		lastId += 1;
		r();
	}));
	await Promise.all(locks);
});