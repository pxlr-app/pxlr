import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { autoid } from "../autoid.ts";
import { Tree } from "./tree.ts";

Deno.test("TreeObject", async (t) => {
	await t.step("serialize and deserialize", async () => {
		const tree1 = new Tree<{ desc: string }>(autoid(), "group", "Dummy", [
			{ id: autoid(), kind: "blob", name: "a", desc: "aaa" },
			{ id: autoid(), kind: "tree", name: "b", desc: "bbb" },
			{ id: autoid(), kind: "blob", name: "c", desc: "ccc" },
		]);
		const obj1 = tree1.toObject(["desc"]);
		const tree2 = await Tree.fromObject<{ desc: string }>(obj1, ["desc"]);
		assertEquals(tree2.id, tree1.id);
		assertEquals(tree2.name, tree1.name);
		assertEquals(tree2.items.length, tree1.items.length);
		assertEquals(tree2.items[0].id, tree1.items[0].id);
		assertEquals(tree2.items[0].kind, tree1.items[0].kind);
		assertEquals(tree2.items[0].name, tree1.items[0].name);
		assertEquals(tree2.items[0].desc, tree1.items[0].desc);
		assertEquals(tree2.items[1].id, tree1.items[1].id);
		assertEquals(tree2.items[1].kind, tree1.items[1].kind);
		assertEquals(tree2.items[1].name, tree1.items[1].name);
		assertEquals(tree2.items[1].desc, tree1.items[1].desc);
		assertEquals(tree2.items[2].id, tree1.items[2].id);
		assertEquals(tree2.items[2].kind, tree1.items[2].kind);
		assertEquals(tree2.items[2].name, tree1.items[2].name);
		assertEquals(tree2.items[2].desc, tree1.items[2].desc);
	});
});
