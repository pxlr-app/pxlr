import { assertEquals } from "@std/assert";
import { Rect } from "@pxlr/math";
import { KDLayeredTree, KDTree } from "./kd_tree.ts";

Deno.test("KDTree", async (t) => {
	await t.step("insert", () => {
		const tree = new KDTree<string>();
		tree.insert(new Rect(0, 0, 10, 10), "A");
		tree.insert(new Rect(0, 0, 5, 5), "B");
		tree.insert(new Rect(5, 5, 5, 5), "C");

		const nodes = Array.from(tree);
		assertEquals(nodes.length, 3);
	});

	await t.step("search", () => {
		const tree = new KDTree<string>();
		tree.insert(new Rect(0, 0, 10, 10), "A");
		tree.insert(new Rect(0, 0, 5, 5), "B");
		tree.insert(new Rect(5, 5, 5, 5), "C");
		tree.insert(new Rect(8, 8, 5, 5), "D");

		const result1 = Array.from(tree.search(new Rect(1, 1, 1, 1)));
		assertEquals(result1.length, 2);
		assertEquals(result1[0].data, "A");
		assertEquals(result1[1].data, "B");

		const result2 = Array.from(tree.search(new Rect(6, 6, 1, 1)));
		assertEquals(result2.length, 2);
		assertEquals(result2[0].data, "A");
		assertEquals(result2[1].data, "C");

		const result3 = Array.from(tree.search(new Rect(10, 10, 8, 8)));
		assertEquals(result3.length, 1);
		assertEquals(result3[0].data, "D");
	});
});

Deno.test("KDLayeredTree", async (t) => {
	await t.step("search", () => {
		const tree = new KDLayeredTree<string>();
		tree.insert(new Rect(0, 0, 10, 10), "A"); // A
		tree.insert(new Rect(0, 0, 5, 5), "B"); // Edits on A
		tree.insert(new Rect(5, 5, 5, 5), "C"); // Edits on A
		tree.insert(new Rect(8, 8, 5, 5), "D"); // Edits on C & new content on A
		tree.insert(new Rect(20, 20, 5, 5), "E"); // New content far away

		const query = new Rect(8, 8, 1, 1); // Somewhere on D, but within the bounds of A and C
		const result1 = Array.from(tree.forwardSearch(query)).map((n) => n.data);
		const result2 = Array.from(tree.backwardSearch(query)).map((n) => n.data);
		assertEquals(result1.length, result2.length);
		assertEquals(result1, ["A", "C", "D"]);
		assertEquals(result2, ["D", "C", "A"]);
	});
});
