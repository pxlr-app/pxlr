import { assertEquals } from "@std/assert";
import { Commit } from "./commit.ts";

Deno.test("Commit", async (t) => {
	await t.step("create", async () => {
		const commit1 = Commit.create(null, "tree_hash", "commiter", new Date("2025-10-01T10:19:00.000Z"), "message");
		assertEquals(commit1.hash, "ddf930b14452d6fe6a64e873782566d92d015360");
		assertEquals(commit1.message, "message");
	});

	await t.step("fromArrayBuffer", async () => {
		const commit1 = Commit.create(null, "tree_hash", "commiter", new Date(), "message");
		const commit2 = await Commit.fromReadableStream(commit1.toReadableStream());
		assertEquals(commit1, commit2);
	});
});
