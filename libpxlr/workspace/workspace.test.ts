import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { BufferedRepository, Commit, MemoryFilesystem, Reference, Tree } from "../../librepo/mod.ts";
import { GroupNode, GroupNodeRegistryEntry, NodeRegistry, NoteNode, NoteNodeRegistryEntry } from "../nodes/mod.ts";
import { Workspace } from "./workspace.ts";
import { autoid } from "../autoid.ts";

const nodeRegistry = new NodeRegistry();
nodeRegistry.register(NoteNodeRegistryEntry);
nodeRegistry.register(GroupNodeRegistryEntry);

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
		await repository.writeReference(
			new Reference("refs/heads/fix/hero", autoid()),
		);
		const workspace = new Workspace({ repository, nodeRegistry });
		const branches = workspace.listBranches();
		assertEquals((await branches.next()).value, "fix/hero");
		assertEquals((await branches.next()).value, "main");
		assertEquals((await branches.next()).done, true);
	});

	await t.step("getBranch", async () => {
		const fs = new MemoryFilesystem();
		const repository = new BufferedRepository(fs);
		const root = new Tree(autoid(), autoid(), "Group", "", []);
		const commit = new Commit(
			autoid(),
			"",
			root.hash,
			"Test <test@test.local>",
			new Date(),
			"",
		);
		const reference = new Reference("refs/heads/main", commit.hash);
		await repository.writeTree(root);
		await repository.writeCommit(commit);
		await repository.writeReference(reference);
		const workspace = new Workspace({ repository, nodeRegistry });
		const branchMain = await workspace.getBranch("main");
		assertEquals(branchMain.name, "main");
	});

	await t.step("checkoutDocument", async () => {
		// const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
		// console.log(tmpFile);
		// const fsFile = await Deno.open(tmpFile, {
		// 	create: true,
		// 	read: true,
		// 	write: true,
		// 	truncate: false,
		// });
		// const denoFile = new DenoFile(fsFile);
		// const zip = new Zip(denoFile);
		// await zip.open();
		// const fs = new ZipFilesystem(zip);
		const fs = new MemoryFilesystem();
		const repository = new BufferedRepository(fs);
		const note1 = NoteNode.new("My Note", "...");
		const root1 = GroupNode.new("", [note1]);
		const tree = new Tree(autoid(), autoid(), "Group", "", []);
		const commit = new Commit(
			autoid(),
			"",
			root1.hash,
			"Test <test@test.local>",
			new Date(),
			"",
		);
		const reference = new Reference("refs/heads/main", commit.hash);
		await repository.writeObject(NoteNodeRegistryEntry.serialize(note1));
		await repository.writeObject(GroupNodeRegistryEntry.serialize(root1));
		await repository.writeTree(tree);
		await repository.writeCommit(commit);
		await repository.writeReference(reference);
		const workspace = new Workspace({ repository, nodeRegistry });
		const document1 = await workspace.checkoutDocumentAtCommit(commit.hash);
		assertEquals(document1.commit.hash, commit.hash);
		const note2 = document1.getNodeByHash(note1.hash);
		assertEquals(note2?.hash, note1.hash);
		assertEquals(note2?.id, note1.id);
		const document2 = await workspace.checkoutDocumentAtReference(
			reference.ref,
		);
		assertEquals(document2.commit.hash, commit.hash);
		const note3 = document2.getNodeByHash(note1.hash);
		assertEquals(note3?.hash, note1.hash);
		assertEquals(note3?.id, note1.id);
		const document3 = await workspace.checkoutDocumentAtBranch("main");
		assertEquals(document3.commit.hash, commit.hash);
		const note4 = document3.getNodeByHash(note1.hash);
		assertEquals(note4?.hash, note1.hash);
		assertEquals(note4?.id, note1.id);

		// await repository.flushToFilesystem();
		// await zip.close();
		// await denoFile.close();
		// fsFile.close();
	});
});
