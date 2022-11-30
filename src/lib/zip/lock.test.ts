import { describe, expect, test } from '@jest/globals';
import { Lock } from "./lock";

describe("Lock", () => {
	test("lock", async () => {
		const l1 = new Lock();
		expect(l1.isFree).toEqual(true);

		let lastId = 0;
		const locks = new Array(10).fill(0).map((_, i) =>
			l1.acquire().then((r) => {
				expect(lastId).toEqual(i);
				lastId += 1;
				r();
			})
		);
		await Promise.all(locks);
	})
});
