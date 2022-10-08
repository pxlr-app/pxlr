import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { autoid } from "../autoid.ts";
import { Tree } from "./tree.ts";

Deno.test("TreeObject", async (t) => {
	await t.step("serialize and deserialize", async () => {
		const tree1 = new Tree(autoid(), "group", "Dummy", [
			{ id: autoid(), kind: "blob", name: "a" },
			{ id: autoid(), kind: "tree", name: "b" },
			{ id: autoid(), kind: "blob", name: "c" },
		]);
		const obj1 = tree1.toObject();
		const tree2 = await Tree.fromObject(obj1);
		assertEquals(tree2.id, tree1.id);
		assertEquals(tree2.name, tree1.name);
		assertEquals(tree2.items.length, tree1.items.length);
		assertEquals(tree2.items[0].id, tree1.items[0].id);
		assertEquals(tree2.items[1].id, tree1.items[1].id);
		assertEquals(tree2.items[2].id, tree1.items[2].id);
	});
});
