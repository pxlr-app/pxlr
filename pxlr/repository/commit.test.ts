import { assertEquals } from "@std/assert";
import { Commit } from "./commit.ts";

Deno.test("Commit", async (t) => {
	await t.step("create", async () => {
		const commit1 = new Commit(null, "tree_hash", "commiter", new Date(), "message");
		assertEquals(commit1.message, "message");
	});

	await t.step("fromArrayBuffer", async () => {
		const commit1 = new Commit(null, "tree_hash", "commiter", new Date(), "message");
		const commit2 = await Commit.fromArrayBuffer(commit1.toArrayBuffer());
		assertEquals(commit1.parent, commit2.parent);
		assertEquals(commit1.tree, commit2.tree);
		assertEquals(commit1.commiter, commit2.commiter);
		assertEquals(commit1.date, commit2.date);
		assertEquals(commit1.message, commit2.message);
	});
});
