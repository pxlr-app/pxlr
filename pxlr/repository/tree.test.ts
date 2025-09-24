import { assertEquals } from "@std/assert";
import { Tree } from "./tree.ts";

Deno.test("Tree", async (t) => {
	await t.step("create", async () => {
		const tree1 = new Tree([]);
		assertEquals(tree1.items, []);
	});

	await t.step("fromArrayBuffer", async () => {
		const tree1 = new Tree([
			{ hash: "hash1", kind: "blob", name: "file1.txt" },
			{ hash: "hash2", kind: "blob", name: "file2.txt" },
		]);
		const tree2 = await Tree.fromArrayBuffer(tree1.toArrayBuffer());
		assertEquals(tree1.items, tree2.items);
	});
});
