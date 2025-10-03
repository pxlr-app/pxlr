import { assertEquals } from "@std/assert";
import { Tree } from "./tree.ts";

Deno.test("Tree", async (t) => {
	await t.step("create", async () => {
		const tree1 = Tree.create([]);
		assertEquals(tree1.hash, "da39a3ee5e6b4b0d3255bfef95601890afd80709");
		assertEquals(tree1.items, []);
	});

	await t.step("fromArrayBuffer", async () => {
		const tree1 = Tree.create([
			{ hash: "hash1", kind: "blob", name: "file1.txt" },
			{ hash: "hash2", kind: "blob", name: "file2.txt" },
		]);
		const tree2 = await Tree.fromReadableStream(tree1.toReadableStream());
		assertEquals(tree1, tree2);
	});
});
