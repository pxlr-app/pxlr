import { assertEquals } from "@std/assert";
import { Tree } from "./tree.ts";

Deno.test("Tree", async (t) => {
	await t.step("create", async () => {
		const tree1 = await Tree.new([]);
		assertEquals(tree1.hash, "6ca760f110478ee00b5fbd9875f032a80808b876");
		assertEquals(tree1.items, []);
	});

	await t.step("fromArrayBuffer", async () => {
		const tree1 = await Tree.new([
			{ hash: "hash1", kind: "blob", name: "file1.txt" },
			{ hash: "hash2", kind: "blob", name: "file2.txt" },
		]);
		const tree2 = await Tree.fromReadableStream(tree1.toReadableStream());
		assertEquals(tree1.hash, tree2.hash);
		assertEquals(tree1.items, tree2.items);
	});
});
