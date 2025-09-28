import { assertEquals } from "@std/assert";
import { Grid2 } from "./grid2.ts";
import { Extent2, Vec2 } from "@pxlr/math";

class Data extends Extent2 {
	#data: string;

	constructor(width: number, height: number, data: string) {
		super(width, height);
		this.#data = data;
	}

	get data() {
		return this.#data;
	}
}

Deno.test("Grid2", async (t) => {
	await t.step("insert uniform", () => {
		const grid = new Grid2<Data>(10, 10);
		const a = new Data(5, 5, "A");
		const b = new Data(5, 5, "B");
		const c = new Data(5, 5, "C");
		const d = new Data(5, 5, "D");
		const e = new Data(5, 5, "E");

		assertEquals(grid.insert(a), new Vec2(0, 0));
		assertEquals(grid.insert(b), new Vec2(5, 0));
		assertEquals(grid.insert(c), new Vec2(0, 5));
		assertEquals(grid.insert(d), new Vec2(5, 5));
		assertEquals(grid.insert(e), false);
	});

	await t.step("insert non-uniform", () => {
		const grid = new Grid2<Data>(10, 10);
		const a = new Data(5, 5, "A");
		const b = new Data(5, 10, "B");
		const c = new Data(5, 5, "C");
		const d = new Data(5, 5, "D");
		const e = new Data(5, 5, "E");

		assertEquals(grid.insert(a), new Vec2(0, 0));
		assertEquals(grid.insert(b), new Vec2(5, 0));
		assertEquals(grid.insert(c), new Vec2(0, 5));
		assertEquals(grid.insert(d), false);
		assertEquals(grid.insert(e), false);
	});

	await t.step("remove", () => {
		const grid = new Grid2<Data>(10, 10);
		grid.insert(new Data(5, 5, "A"));
		grid.insert(new Data(5, 5, "B"));
		const c = new Data(5, 5, "C");
		grid.insert(c);
		grid.insert(new Data(5, 5, "D"));

		assertEquals(grid.percetageUsed(), 1.0);

		assertEquals(grid.remove(c), true);

		assertEquals(grid.percetageUsed(), 0.75);
	});
});
