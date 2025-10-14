import { assertEquals } from "@std/assert";
import { Commit } from "./commit.ts";

Deno.test("Commit", async (t) => {
	await t.step("create", async () => {
		const commit1 = new Commit({ tree: "tree_hash", commiter: "commiter", date: new Date("2025-10-01T10:19:00.000Z"), message: "message" });
		assertEquals(commit1.message, "message");
	});

	await t.step("fromArrayBuffer", async () => {
		const commit1 = new Commit({ tree: "tree_hash", commiter: "commiter", date: new Date(), message: "message" });
		const commit2 = await Commit.fromReadableStream(commit1.toReadableStream());
		assertEquals(commit1, commit2);
	});
});
