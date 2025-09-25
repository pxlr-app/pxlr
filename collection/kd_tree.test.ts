import { assertEquals } from "@std/assert";
import { Rect } from "@pxlr/math";
import { KDNode } from "./kd_tree.ts";

Deno.test("KDTree", async (t) => {
	await t.step("insert", () => {
		const root = new KDNode(new Rect(0, 0, 10, 10), "A");
		root.insert(new KDNode(new Rect(0, 0, 5, 5), "B"));
		root.insert(new KDNode(new Rect(5, 5, 5, 5), "C"));

		const nodes = Array.from(root);
		assertEquals(nodes.length, 3);
	});

	await t.step("search", () => {
		const root = new KDNode(new Rect(0, 0, 20, 20), "A");
		root.insert(new KDNode(new Rect(0, 0, 5, 5), "B"));
		root.insert(new KDNode(new Rect(5, 5, 5, 5), "C"));
		root.insert(new KDNode(new Rect(8, 8, 5, 5), "D"));

		const result1 = Array.from(root.search(new Rect(1, 1, 1, 1)));
		assertEquals(result1.length, 2);
		assertEquals(result1[0].data, "A");
		assertEquals(result1[1].data, "B");

		const result2 = Array.from(root.search(new Rect(6, 6, 1, 1)));
		assertEquals(result2.length, 2);
		assertEquals(result2[0].data, "A");
		assertEquals(result2[1].data, "C");

		const result3 = Array.from(root.search(new Rect(10, 10, 8, 8)));
		assertEquals(result3.length, 2);
		assertEquals(result3[0].data, "A");
		assertEquals(result3[1].data, "D");
	});
});
