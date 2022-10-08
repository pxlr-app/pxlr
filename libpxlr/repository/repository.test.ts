import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { MemoryFilesystem } from "../filesystem/memory.ts";
import { Repository } from "./repository.ts";

Deno.test("Repository", async (t) => {
	const fs1 = makeVirtualFs({
		[`/HEAD`]: `refs/heads/main`,
		[`/refs/heads/main`]: `NYyv8vVWdRah1NLmXcpD`,
		[`/objects/J/z/JzF21pOr54Xn0fGrhQG6`]: `id JzF21pOr54Xn0fGrhQG6\r\nkind note\r\nname README\r\n\r\nTest`,
		[`/objects/u/t/utBjcuH46AeQaczTdC12`]: `id utBjcuH46AeQaczTdC12\r\nkind tree\r\nsub-kind group\r\nname Root\r\n\r\nnote JzF21pOr54Xn0fGrhQG6 README`,
		[`/objects/N/Y/NYyv8vVWdRah1NLmXcpD`]:
			`id NYyv8vVWdRah1NLmXcpD\r\nparent \r\ntree utBjcuH46AeQaczTdC12\r\ncommiter John Doe <jd@test.local>\r\ndate 2022-10-07T02:14:56.247Z\r\n\r\ninit`,
		[`/objects/W/o/Wop7bFXo65cxSUFvDcJK`]:
			`id Wop7bFXo65cxSUFvDcJK\r\nparent NYyv8vVWdRah1NLmXcpD\r\ntree \r\ncommiter John Doe <jd@test.local>\r\ndate 2022-10-07T02:14:56.247Z\r\n\r\ndup`,
	});

	await t.step("get head reference", async () => {
		const repo = new Repository(fs1);
		const headRef = await repo.getHead();
		assertEquals(headRef, "refs/heads/main");
	});

	await t.step("get reference", async () => {
		const repo = new Repository(fs1);
		const commitId = await repo.getReference("refs/heads/main");
		assertEquals(commitId, "NYyv8vVWdRah1NLmXcpD");
	});

	await t.step("get commit", async () => {
		const repo = new Repository(fs1);
		const commit = await repo.getCommit("NYyv8vVWdRah1NLmXcpD");
		console.log(commit);
	});

	await t.step("get tree", async () => {
		const repo = new Repository(fs1);
		const tree = await repo.getTree("utBjcuH46AeQaczTdC12");
		console.log(tree);
	});
});

function makeVirtualFs(files: Record<string, string>) {
	const encoder = new TextEncoder();
	const buffers: Record<string, Buffer> = Object.fromEntries(Object.entries(files).map(([key, value]) => [key, new Buffer(encoder.encode(value))]));
	return new MemoryFilesystem(buffers);
}
