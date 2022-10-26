import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { BufferedRepository, Commit, MemoryFilesystem, Reference, Tree } from "../repository/mod.ts";
import { GroupNode, GroupNodeRegistryEntry, NodeRegistry, NoteNode, NoteNodeRegistryEntry } from "../nodes/mod.ts";
import { Workspace } from "./workspace.ts";
import { autoid } from "../autoid.ts";

const nodeRegistry = new NodeRegistry();
nodeRegistry.registerNodeConstructor(NoteNodeRegistryEntry);
nodeRegistry.registerTreeConstructor(GroupNodeRegistryEntry);

Deno.test("Document", async (t) => {
	await t.step("executeCommand", async () => {
		// const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
		// console.log(tmpFile);
		// const fsFile = await Deno.open(tmpFile, { create: true, read: true, write: true, truncate: true });
		// const denoFile = new DenoFile(fsFile);
		// const zip = new Zip(denoFile);
		// await zip.open();
		// const fs = new ZipFilesystem(zip);
		const fs = new MemoryFilesystem();
		const repository = new BufferedRepository(fs);
		const note1 = new NoteNode(autoid(), autoid(), "My Note", "...");
		const root1 = new GroupNode(autoid(), autoid(), "", [note1]);
		const tree = new Tree(autoid(), autoid(), "group", "", []);
		const commit = new Commit(autoid(), "", root1.hash, "Test <test@test.local>", new Date(), "init");
		const reference = new Reference("refs/heads/main", commit.hash);
		await repository.writeObject(note1.toObject());
		await repository.writeObject(root1.toObject());
		await repository.writeTree(tree);
		await repository.writeCommit(commit);
		await repository.writeReference(reference);
		const workspace1 = new Workspace({ repository, nodeRegistry });
		const document1 = await workspace1.checkoutDocumentAtBranch("main", { shallow: false });
		await document1.executeCommand(note1.rename("Your note"), "Test <test@test.local>", "Rename My Note");
		const branch = await workspace1.getBranch("main");
		const iterHistory = branch.iterHistory();
		assertEquals((await iterHistory.next()).value.message, "Rename My Note");
		assertEquals((await iterHistory.next()).value.message, "init");
		assertEquals((await iterHistory.next()).done, true);

		await repository.flushToFilesystem();

		assertEquals(fs.entries.size, 8);

		const workspace2 = new Workspace({ repository, nodeRegistry });
		const document2 = await workspace2.checkoutDocumentAtBranch("main", { shallow: false });
		const note2 = document2.getNodeById(note1.id);
		assertEquals(note2?.name, "Your note");

		// await zip.close();
		// await denoFile.close();
		// fsFile.close();
	});
});
