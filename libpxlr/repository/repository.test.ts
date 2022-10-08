import { assert, assertEquals, assertFalse } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { MemoryFilesystem } from "../filesystem/memory.ts";
import { Repository } from "./repository.ts";

Deno.test("Repository", async (t) => {
	const fs1 = makeVirtualFs({
		[`/HEAD`]: `refs/heads/main`,
		[`/refs/heads/main`]: `NYyv8vVWdRah1NLmXcpD`,
		[`/objects/J/z/JzF21pOr54Xn0fGrhQG6`]: `id JzF21pOr54Xn0fGrhQG6\r\nkind note\r\nname README\r\n\r\nTest`,
		[`/objects/Z/z/ZzF21pOr54Xn0fGrhQG6`]: `id ZzF21pOr54Xn0fGrhQG6\r\nkind note\r\nname README\r\n\r\nTest`,
		[`/objects/Z/t/ZtBjcuH46AeQaczTdC12`]: `id ZtBjcuH46AeQaczTdC12\r\nkind tree\r\nsub-kind group\r\nname My%20Project\r\n\r\nnote ZzF21pOr54Xn0fGrhQG6 README`,
		[`/objects/u/t/utBjcuH46AeQaczTdC12`]:
			`id utBjcuH46AeQaczTdC12\r\nkind tree\r\nsub-kind group\r\nname Root\r\n\r\nnote JzF21pOr54Xn0fGrhQG6 README\r\ntree ZtBjcuH46AeQaczTdC12 My%20Project`,
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
		assertEquals(commit.id, "NYyv8vVWdRah1NLmXcpD");
		assertEquals(commit.parent, "");
		assertEquals(commit.tree, "utBjcuH46AeQaczTdC12");
		assertEquals(commit.commiter, "John Doe <jd@test.local>");
		assertEquals(commit.date, new Date("2022-10-07T02:14:56.247Z"));
		assertEquals(commit.message, "init");
	});

	await t.step("get tree", async () => {
		const repo = new Repository(fs1);
		const tree = await repo.getTree("utBjcuH46AeQaczTdC12");
		assertEquals(tree.id, "utBjcuH46AeQaczTdC12");
		assertEquals(tree.subKind, "group");
		assertEquals(tree.name, "Root");
		assertEquals(tree.items.length, 2);
		assertEquals(tree.items[0].id, "JzF21pOr54Xn0fGrhQG6");
		assertEquals(tree.items[0].kind, "note");
		assertEquals(tree.items[0].name, "README");
		assertEquals(tree.items[1].id, "ZtBjcuH46AeQaczTdC12");
		assertEquals(tree.items[1].kind, "tree");
		assertEquals(tree.items[1].name, "My Project");
	});

	await t.step("walk tree", async () => {
		const repo = new Repository(fs1);
		const iter = repo.walkTree("utBjcuH46AeQaczTdC12");

		const res1 = await iter.next();
		assertFalse(res1.done);
		assertEquals(res1.value.id, "utBjcuH46AeQaczTdC12");

		const res2 = await iter.next();
		assertFalse(res2.done);
		assertEquals(res2.value.id, "ZtBjcuH46AeQaczTdC12");

		const res3 = await iter.next();
		assert(res3.done);
	});

	await t.step("walk history", async () => {
		const repo = new Repository(fs1);
		const iter = repo.walkHistory("Wop7bFXo65cxSUFvDcJK");

		const res1 = await iter.next();
		assertFalse(res1.done);
		assertEquals(res1.value.id, "Wop7bFXo65cxSUFvDcJK");

		const res2 = await iter.next();
		assertFalse(res2.done);
		assertEquals(res2.value.id, "NYyv8vVWdRah1NLmXcpD");

		const res3 = await iter.next();
		assert(res3.done);
	});
});

function makeVirtualFs(files: Record<string, string>) {
	const encoder = new TextEncoder();
	const buffers: Record<string, ArrayBuffer> = Object.fromEntries(Object.entries(files).map(([key, value]) => [key, encoder.encode(value)]));
	return new MemoryFilesystem(buffers);
}
