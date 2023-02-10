import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { autoid } from "../libpxlr/autoid.ts";
import { Commit } from "./commit.ts";

Deno.test("CommitObject", async (t) => {
	await t.step("serialize and deserialize", async () => {
		const commit1 = new Commit(
			autoid(),
			autoid(),
			autoid(),
			"John Doe <jdoe@example.org>",
			new Date(),
			"init",
		);
		const obj1 = commit1.toObject();
		const commit2 = await Commit.fromObject(obj1);
		assertEquals(commit2.hash, commit1.hash);
		assertEquals(commit2.parent, commit1.parent);
		assertEquals(commit2.tree, commit1.tree);
		assertEquals(commit2.commiter, commit1.commiter);
		assertEquals(commit2.date, commit1.date);
		assertEquals(commit2.message, commit1.message);
	});
});
