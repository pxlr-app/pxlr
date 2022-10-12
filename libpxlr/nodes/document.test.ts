import { assertEquals, assertExists, assertInstanceOf } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { MemoryFilesystem } from "../repository/filesystem/memory.ts";
import { Repository } from "../repository/mod.ts";
import { Document, GroupNode, NoteNode, Registry } from "./mod.ts";

Deno.test("Document", async (t) => {
	const registry = new Registry();
	registry.registerNodeConstructor("note", NoteNode);
	registry.registerTreeConstructor("group", GroupNode);

	const fs = makeVirtualFs({
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
	const repository = new Repository(fs);

	await t.step("create", async () => {
		const doc = new Document({ repository, registry });
		await doc.create();
		assertExists(doc);
		assertEquals(doc.reference, "refs/heads/main");
		assertInstanceOf(doc.rootNode, GroupNode);
		assertEquals(doc.rootNode.name, "");
	});

	await t.step("loadAtHead", async () => {
		const doc = new Document({ repository, registry });
		await doc.openAtHead();
		assertExists(doc);
		assertEquals(doc.rootNode?.id, "utBjcuH46AeQaczTdC12");
		assertEquals(doc.rootNode?.kind, "group");
	});

	await t.step("get node", async () => {
		const doc = new Document({ repository, registry });
		await doc.openAtHead();
		const note1 = await doc.loadNodeById("ZzF21pOr54Xn0fGrhQG6") as NoteNode;
		assertEquals(note1.id, "ZzF21pOr54Xn0fGrhQG6");
		assertEquals(note1.name, "README");
		assertEquals(note1.content, "Test2");
		const note2 = doc.getNodeById(note1.id) as NoteNode;
		assertEquals(note2.id, "ZzF21pOr54Xn0fGrhQG6");
		assertEquals(note2.name, "README");
		assertEquals(note2.content, "Test2");
	});

	await t.step("get node at path", async () => {
		const doc = new Document({ repository, registry });
		await doc.openAtHead();
		await doc.load();
		assertEquals(doc.getNodeAtPath(["README"])?.id, "JzF21pOr54Xn0fGrhQG6");
		assertEquals(doc.getNodeAtPath(["My Project", "README"])?.id, "ZzF21pOr54Xn0fGrhQG6");
	});

	await t.step("get tree", async () => {
		const doc = new Document({ repository, registry });
		await doc.openAtHead();
		const group = await doc.load() as GroupNode;
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
		const doc = new Document({ repository, registry });
		await doc.openAtHead();
		const group = doc.rootNode as GroupNode;
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
		const doc = new Document({ repository, registry });
		await doc.openAtHead();
		const note1 = await doc.loadNodeById("ZzF21pOr54Xn0fGrhQG6") as NoteNode;
		const group = await doc.loadNodeById("utBjcuH46AeQaczTdC12") as GroupNode;
		const group2 = group.children[1] as GroupNode;
		assertEquals(group2.children[0], note1);
	});

	await t.step("save document", async () => {
		const fs = makeVirtualFs({
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
		const repository = new Repository(fs);

		const doc1 = new Document({ repository, registry });
		await doc1.openAtHead();

		const commit1 = doc1.commit!;

		await doc1.load();
		const note1 = doc1.getNodeById("ZzF21pOr54Xn0fGrhQG6")!;
		await doc1.executeCommand(note1.rename("RENAME2"));
		assertEquals(fs.entries.size, 16);

		const doc2 = new Document({ repository, registry });
		await doc2.openAtCommit(commit1);
		await doc2.load();

		const doc3 = new Document({ repository, registry });
		await doc3.openAtHead();
		await doc3.load();
		console.log(Deno.inspect(doc2.rootNode, { depth: 100 }));
		console.log(Deno.inspect(doc3.rootNode, { depth: 100 }));
	});
});

function makeVirtualFs(files: Record<string, string>) {
	const encoder = new TextEncoder();
	const buffers: Record<string, ArrayBuffer> = Object.fromEntries(Object.entries(files).map(([key, value]) => [key, encoder.encode(value)]));
	return new MemoryFilesystem(buffers);
}
