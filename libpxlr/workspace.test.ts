import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { BufferedRepository, Commit, MemoryFilesystem, Reference, Tree } from "./repository/mod.ts";
import { GroupNodeRegistryEntry, NodeRegistry, NoteNodeRegistryEntry } from "./nodes/mod.ts";
import { Workspace } from "./workspace.ts";
import { autoid } from "./autoid.ts";

const nodeRegistry = new NodeRegistry();
nodeRegistry.registerNodeConstructor(NoteNodeRegistryEntry);
nodeRegistry.registerTreeConstructor(GroupNodeRegistryEntry);

Deno.test("Workspace", async (t) => {
	await t.step("init", () => {
		const fs = new MemoryFilesystem();
		const repository = new BufferedRepository(fs);
		const _workspace = new Workspace({ repository, nodeRegistry });
	});

	await t.step("listBranches", async () => {
		const fs = new MemoryFilesystem();
		const repository = new BufferedRepository(fs);
		await repository.writeReference(new Reference("refs/heads/main", autoid()));
		await repository.writeReference(new Reference("refs/heads/fix%2Fhero", autoid()));
		const workspace = new Workspace({ repository, nodeRegistry });
		const branches = workspace.listBranches();
		assertEquals((await branches.next()).value, "fix/hero");
		assertEquals((await branches.next()).value, "main");
		assertEquals((await branches.next()).done, true);
	});

	await t.step("getBranch", async () => {
		const fs = new MemoryFilesystem();
		const repository = new BufferedRepository(fs);
		const root = new Tree(autoid(), autoid(), "group", "", []);
		const commit = new Commit(autoid(), autoid(), root.id, "Test <test@test.local>", new Date(), "");
		await repository.writeTree(root);
		await repository.writeCommit(commit);
		await repository.writeReference(new Reference("refs/heads/main", commit.hash));
		const workspace = new Workspace({ repository, nodeRegistry });
		const branchMain = await workspace.getBranch("main");
		assertEquals(branchMain.name, "main");
	});

	// await t.step("getDetachedBranch", async () => {
	// 	const fs = new MemoryFilesystem();
	// 	const repository = new BufferedRepository(fs);
	// 	const root = new Tree(autoid(), autoid(), "group", "", []);
	// 	const commit = new Commit(autoid(), autoid(), "", root.id, "Test <test@test.local>", new Date(), "");
	// 	await repository.writeTree(root);
	// 	await repository.writeCommit(commit);
	// 	await repository.writeReference("refs/heads/main", commit.id);
	// 	const workspace = new Workspace({ repository, nodeRegistry });
	// 	const branch = await workspace.getDetachedBranch(commit.id);
	// 	assertEquals(branch.name, undefined);
	// 	assertEquals(branch.isDetached, true);
	// });
});

// Deno.test("Branch", async (t) => {
// 	await t.step("walkHistory", async () => {
// 		const workspace = new Workspace({ repository, nodeRegistry });
// 		const branchMain = await workspace.getBranch("main");
// 		const historyIter1 = branchMain.walkHistory();
// 		assertEquals((await historyIter1.next()).value.id, "NYyv8vVWdRah1NLmXcpD");
// 		assertEquals((await historyIter1.next()).done, true);
// 		const branchFixHero = await workspace.getBranch("fix/hero");
// 		const historyIter2 = branchFixHero.walkHistory();
// 		assertEquals((await historyIter2.next()).value.id, "Wop7bFXo65cxSUFvDcJK");
// 		assertEquals((await historyIter2.next()).value.id, "NYyv8vVWdRah1NLmXcpD");
// 		assertEquals((await historyIter2.next()).done, true);
// 	});

// 	await t.step("checkoutDocument", async () => {
// 		const workspace = new Workspace({ repository, nodeRegistry });
// 		const branchFixHero = await workspace.getBranch("fix/hero");
// 		const docFixHero = await branchFixHero.checkoutDocument();
// 		console.log(Deno.inspect(docFixHero.rootNode, { depth: 10 }));
// 	});
// });
