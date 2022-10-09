import { assertEquals, assertExists } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { MemoryFilesystem } from "../repository/filesystem/memory.ts";
import { Repository } from "../repository/mod.ts";
import { Document, GroupNode, NoteNode, Registry } from "./mod.ts";

Deno.test("CommitObject", async (t) => {
	const registry = new Registry();
	registry.registerNodeConstructor("note", NoteNode);
	registry.registerTreeConstructor("group", GroupNode);

	const fs1 = makeVirtualFs({
		[`/HEAD`]: `refs/heads/main`,
		[`/refs/heads/main`]: `NYyv8vVWdRah1NLmXcpD`,
		[`/objects/J/z/JzF21pOr54Xn0fGrhQG6`]: `id JzF21pOr54Xn0fGrhQG6\r\nkind note\r\nname README\r\n\r\nTest1`,
		[`/objects/Z/z/ZzF21pOr54Xn0fGrhQG6`]: `id ZzF21pOr54Xn0fGrhQG6\r\nkind note\r\nname README\r\n\r\nTest2`,
		[`/objects/Z/t/ZtBjcuH46AeQaczTdC12`]: `id ZtBjcuH46AeQaczTdC12\r\nkind tree\r\nsub-kind group\r\nname My%20Project\r\n\r\nnote ZzF21pOr54Xn0fGrhQG6 README`,
		[`/objects/u/t/utBjcuH46AeQaczTdC12`]:
			`id utBjcuH46AeQaczTdC12\r\nkind tree\r\nsub-kind group\r\nname Root\r\n\r\nnote JzF21pOr54Xn0fGrhQG6 README\r\ntree ZtBjcuH46AeQaczTdC12 My%20Project`,
		[`/objects/N/Y/NYyv8vVWdRah1NLmXcpD`]:
			`id NYyv8vVWdRah1NLmXcpD\r\nparent \r\ntree utBjcuH46AeQaczTdC12\r\ncommiter John Doe <jd@test.local>\r\ndate 2022-10-07T02:14:56.247Z\r\n\r\ninit`,
		[`/objects/W/o/Wop7bFXo65cxSUFvDcJK`]:
			`id Wop7bFXo65cxSUFvDcJK\r\nparent NYyv8vVWdRah1NLmXcpD\r\ntree \r\ncommiter John Doe <jd@test.local>\r\ndate 2022-10-07T02:14:56.247Z\r\n\r\ndup`,
	});
	const repo = new Repository(fs1);

	await t.step("loadAtHead", async () => {
		const doc = await Document.loadAtHead(repo, registry);
		assertExists(doc);
	});

	await t.step("get node", async () => {
		const doc = await Document.loadAtHead(repo, registry);
		const note1 = await doc.getNode("ZzF21pOr54Xn0fGrhQG6") as NoteNode;
		assertEquals(note1.id, "ZzF21pOr54Xn0fGrhQG6");
		assertEquals(note1.name, "README");
		assertEquals(note1.content, "Test2");
	});

	await t.step("get tree", async () => {
		const doc = await Document.loadAtHead(repo, registry);
		const group = await doc.getNode("utBjcuH46AeQaczTdC12") as GroupNode;
		assertEquals(group.id, "utBjcuH46AeQaczTdC12");
		assertEquals(group.name, "Root");
		assertEquals(group.children.length, 2);
		const note1 = group.children[0] as NoteNode;
		assertEquals(note1.id, "JzF21pOr54Xn0fGrhQG6");
		assertEquals(note1.name, "README");
		assertEquals(note1.content, "Test1");
		const group2 = group.children[1] as GroupNode;
		assertEquals(group2.id, "ZtBjcuH46AeQaczTdC12");
		assertEquals(group2.name, "My Project");
		assertEquals(group2.children.length, 1);
		const note2 = group2.children[0] as NoteNode;
		assertEquals(note2.id, "ZzF21pOr54Xn0fGrhQG6");
		assertEquals(note2.name, "README");
		assertEquals(note2.content, "Test2");
	});

	await t.step("get tree unloaded", async () => {
		const doc = await Document.loadAtHead(repo, registry);
		const group = await doc.getUnloadedNode("utBjcuH46AeQaczTdC12");
		assertEquals(group.id, "utBjcuH46AeQaczTdC12");
		assertEquals(group.name, "Root");
		assertEquals(group.kind, "group");
		assertEquals(group.children.length, 2);
		assertEquals(group.children[0].id, "JzF21pOr54Xn0fGrhQG6");
		assertEquals(group.children[0].kind, "note");
		assertEquals(group.children[0].name, "README");
		assertEquals(group.children[1].id, "ZtBjcuH46AeQaczTdC12");
		assertEquals(group.children[1].kind, "group");
		assertEquals(group.children[1].name, "My Project");
	});

	await t.step("caches node", async () => {
		const doc = await Document.loadAtHead(repo, registry);
		const note1 = await doc.getNode("ZzF21pOr54Xn0fGrhQG6") as NoteNode;
		const group = await doc.getNode("utBjcuH46AeQaczTdC12") as GroupNode;
		const group2 = group.children[1] as GroupNode;
		assertEquals(group2.children[0], note1);
	});
});

function makeVirtualFs(files: Record<string, string>) {
	const encoder = new TextEncoder();
	const buffers: Record<string, ArrayBuffer> = Object.fromEntries(Object.entries(files).map(([key, value]) => [key, encoder.encode(value)]));
	return new MemoryFilesystem(buffers);
}
