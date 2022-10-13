import { assertEquals, assertInstanceOf } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { MemoryFilesystem } from "./repository/filesystem/memory.ts";
import { Repository } from "./repository/mod.ts";
import { GroupNode, NodeRegistry, NoteNode, UnloadedNode } from "./nodes/mod.ts";
import { Workspace } from "./workspace.ts";

const nodeRegistry = new NodeRegistry();
nodeRegistry.registerNodeConstructor("note", NoteNode);
nodeRegistry.registerTreeConstructor("group", GroupNode);
const fs = makeVirtualFs({
	[`/refs/heads/main`]: `NYyv8vVWdRah1NLmXcpD`,
	[`/refs/heads/fix%2Fhero`]: `Wop7bFXo65cxSUFvDcJK`,
	[`/objects/J/z/JzF21pOr54Xn0fGrhQG6`]: `id JzF21pOr54Xn0fGrhQG6\r\nkind note\r\nname README\r\n\r\nTest1`,
	[`/objects/Z/z/ZzF21pOr54Xn0fGrhQG6`]: `id ZzF21pOr54Xn0fGrhQG6\r\nkind note\r\nname README\r\n\r\nTest2`,
	[`/objects/Z/t/ZtBjcuH46AeQaczTdC12`]: `id ZtBjcuH46AeQaczTdC12\r\nkind tree\r\nsub-kind group\r\nname My%20Project\r\n\r\nnote ZzF21pOr54Xn0fGrhQG6 README`,
	[`/objects/u/t/utBjcuH46AeQaczTdC12`]: `id utBjcuH46AeQaczTdC12\r\nkind tree\r\nsub-kind group\r\nname Root\r\n\r\nnote JzF21pOr54Xn0fGrhQG6 README`,
	[`/objects/Z/u/ZuBjcuH46AeQaczTdC12`]:
		`id utBjcuH46AeQaczTdC12\r\nkind tree\r\nsub-kind group\r\nname Root\r\n\r\nnote JzF21pOr54Xn0fGrhQG6 README\r\ntree ZtBjcuH46AeQaczTdC12 My%20Project`,
	[`/objects/N/Y/NYyv8vVWdRah1NLmXcpD`]:
		`id NYyv8vVWdRah1NLmXcpD\r\nparent \r\ntree utBjcuH46AeQaczTdC12\r\ncommiter John Doe <jd@test.local>\r\ndate 2022-10-07T02:14:56.247Z\r\n\r\ninit`,
	[`/objects/W/o/Wop7bFXo65cxSUFvDcJK`]:
		`id Wop7bFXo65cxSUFvDcJK\r\nparent NYyv8vVWdRah1NLmXcpD\r\ntree ZuBjcuH46AeQaczTdC12\r\ncommiter John Doe <jd@test.local>\r\ndate 2022-10-07T02:14:56.247Z\r\n\r\ndup`,
});
const repository = new Repository(fs);

Deno.test("Workspace", async (t) => {
	await t.step("init", async () => {
	});

	await t.step("list branches", async () => {
		const workspace = new Workspace({ repository, nodeRegistry });
		const branches = workspace.listBranches();
		assertEquals((await branches.next()).value, "main");
		assertEquals((await branches.next()).value, "fix/hero");
		assertEquals((await branches.next()).done, true);
	});

	await t.step("checkout branch", async () => {
		const workspace = new Workspace({ repository, nodeRegistry });
		const branchMain = await workspace.checkoutBranch("main");
		const rootMain = branchMain.rootNode as GroupNode;
		assertEquals(rootMain.id, "utBjcuH46AeQaczTdC12");
		assertEquals(rootMain.children.length, 1);
		assertEquals(rootMain.children[0].id, "JzF21pOr54Xn0fGrhQG6");

		const branchFixHero = await workspace.checkoutBranch("fix/hero");
		const rootFixHero = branchFixHero.rootNode as GroupNode;
		assertEquals(rootFixHero.id, "utBjcuH46AeQaczTdC12");
		assertEquals(rootFixHero.children.length, 2);
		assertEquals(rootFixHero.children[0].id, "JzF21pOr54Xn0fGrhQG6");
		const group1FixHero = rootFixHero.children[1] as GroupNode;
		assertEquals(group1FixHero.id, "ZtBjcuH46AeQaczTdC12");
		assertEquals(group1FixHero.children.length, 1);
		assertEquals(group1FixHero.children[0].id, "ZzF21pOr54Xn0fGrhQG6");
	});

	await t.step("getLog", async () => {
		const workspace = new Workspace({ repository, nodeRegistry });
		const logIter = workspace.getLog("Wop7bFXo65cxSUFvDcJK");
		assertEquals((await logIter.next()).value.message, "dup");
		assertEquals((await logIter.next()).value.message, "init");
		assertEquals((await logIter.next()).done, true);
	});
});

Deno.test("Branch", async (t) => {
	await t.step("execute command", async () => {
		const workspace = new Workspace({ repository, nodeRegistry });
		const branchMain = await workspace.checkoutBranch("main");
		const note1 = branchMain.getNodeAtPath(["README"]) as UnloadedNode;
		assertInstanceOf(note1, UnloadedNode);
		assertEquals(note1.id, "JzF21pOr54Xn0fGrhQG6");
		branchMain.executeCommand(await note1.load(workspace));
		const note2 = branchMain.getNodeAtPath(["README"]) as NoteNode;
		assertInstanceOf(note2, NoteNode);
		assertEquals(note2.id, "JzF21pOr54Xn0fGrhQG6");
		assertEquals(note2.content, "Test1");
	});
})

function makeVirtualFs(files: Record<string, string>) {
	const encoder = new TextEncoder();
	const buffers: Record<string, ArrayBuffer> = Object.fromEntries(Object.entries(files).map(([key, value]) => [key, encoder.encode(value)]));
	return new MemoryFilesystem(buffers);
}
