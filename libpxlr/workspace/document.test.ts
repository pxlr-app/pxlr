import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { BufferedRepository, Commit, MemoryFilesystem, Reference, Tree } from "../../librepo/mod.ts";
import { GroupNode, GroupNodeRegistryEntry, NodeRegistry, NoteNode, NoteNodeRegistryEntry } from "../nodes/mod.ts";
import { Workspace } from "./workspace.ts";
import { autoid } from "../autoid.ts";

const nodeRegistry = new NodeRegistry();
nodeRegistry.register(NoteNodeRegistryEntry);
nodeRegistry.register(GroupNodeRegistryEntry);

Deno.test("Document", async (t) => {
	await t.step("dispatch", async () => {
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
			"init",
		);
		const reference = new Reference("refs/heads/main", commit.hash);
		await repository.writeObject(NoteNodeRegistryEntry.serialize(note1));
		await repository.writeObject(GroupNodeRegistryEntry.serialize(root1));
		await repository.writeTree(tree);
		await repository.writeCommit(commit);
		await repository.writeReference(reference);
		const workspace1 = new Workspace({ repository, nodeRegistry });
		const document1 = await workspace1.checkoutDocumentAtBranch("main", {
			shallow: false,
		});
		for (let i = 1_000; --i >= 0;) {
			const note = document1.getNodeById(note1.id)!;
			document1.dispatch(note.rename(`My Note ${i}`));
			if (i % 100 === 0) {
				await document1.commitChanges(
					"Test <test@test.local>",
					`Rename My Note ${i}`,
				);
			}
		}
		// assertEquals(document1.getNodeById(note1.id)!.name, "My Note 0");
		// document1.undoCommand();
		// assertEquals(document1.getNodeById(note1.id)!.name, "My Note 1");
		// document1.redoCommand();
		// assertEquals(document1.getNodeById(note1.id)!.name, "My Note 0");

		//await document1.commitChanges("Test <test@test.local>", `Rename My Note`);

		// const branch = await workspace1.getBranch("main");
		// for await (const commit of branch.iterHistory()) {
		// 	console.log(commit.message);
		// }
		// const iterHistory = branch.iterHistory();
		// assertEquals((await iterHistory.next()).value.message, "Rename My Note");
		// assertEquals((await iterHistory.next()).value.message, "init");
		// assertEquals((await iterHistory.next()).done, true);

		await repository.flushToFilesystem();

		const workspace2 = new Workspace({ repository, nodeRegistry });
		const document2 = await workspace2.checkoutDocumentAtBranch("main", {
			shallow: false,
		});
		const note2 = document2.getNodeById(note1.id);
		assertEquals(note2?.name, "My Note 0");
	});
});
