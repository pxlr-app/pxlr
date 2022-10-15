import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { MemoryFilesystem } from "./repository/filesystem/memory.ts";
import { Repository } from "./repository/mod.ts";
import { GroupNodeRegistryEntry, NodeRegistry, NoteNodeRegistryEntry } from "./nodes/mod.ts";
import { Workspace } from "./workspace.ts";

const nodeRegistry = new NodeRegistry();
nodeRegistry.registerNodeConstructor(NoteNodeRegistryEntry);
nodeRegistry.registerTreeConstructor(GroupNodeRegistryEntry);
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

	await t.step("listBranches", async () => {
		const workspace = new Workspace({ repository, nodeRegistry });
		const branches = workspace.listBranches();
		assertEquals((await branches.next()).value, "main");
		assertEquals((await branches.next()).value, "fix/hero");
		assertEquals((await branches.next()).done, true);
	});

	await t.step("getBranch", async () => {
		const workspace = new Workspace({ repository, nodeRegistry });
		const branchMain = await workspace.getBranch("main");
		assertEquals(branchMain.name, "main");
		assertEquals(branchMain.isDetached, false);
	});

	await t.step("getDetachedBranch", async () => {
		const workspace = new Workspace({ repository, nodeRegistry });
		const branch = await workspace.getDetachedBranch("Wop7bFXo65cxSUFvDcJK");
		assertEquals(branch.name, undefined);
		assertEquals(branch.isDetached, true);
	});
});

Deno.test("Branch", async (t) => {
	await t.step("walkHistory", async () => {
		const workspace = new Workspace({ repository, nodeRegistry });
		const branchMain = await workspace.getBranch("main");
		const historyIter1 = branchMain.walkHistory();
		assertEquals((await historyIter1.next()).value.id, "NYyv8vVWdRah1NLmXcpD");
		assertEquals((await historyIter1.next()).done, true);
		const branchFixHero = await workspace.getBranch("fix/hero");
		const historyIter2 = branchFixHero.walkHistory();
		assertEquals((await historyIter2.next()).value.id, "Wop7bFXo65cxSUFvDcJK");
		assertEquals((await historyIter2.next()).value.id, "NYyv8vVWdRah1NLmXcpD");
		assertEquals((await historyIter2.next()).done, true);
	});

	await t.step("checkoutDocument", async () => {
		const workspace = new Workspace({ repository, nodeRegistry });
		const branchFixHero = await workspace.getBranch("fix/hero");
		const docFixHero = await branchFixHero.checkoutDocument();
		console.log(Deno.inspect(docFixHero.rootNode, { depth: 10 }));
	});
});

function makeVirtualFs(files: Record<string, string>) {
	const encoder = new TextEncoder();
	const buffers: Record<string, ArrayBuffer> = Object.fromEntries(Object.entries(files).map(([key, value]) => [key, encoder.encode(value)]));
	return new MemoryFilesystem(buffers);
}
