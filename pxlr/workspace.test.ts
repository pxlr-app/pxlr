import { MemoryRootFolder } from "@pxlr/vfs/memory";
import { Repository } from "./repository/repository.ts";
import { Workspace } from "./workspace.ts";
import { NodeRegistry } from "./document/node_registry.ts";
import { NodeCache } from "./document/node_cache.ts";
import { NoteNode, NoteNodeRegistryEntry } from "./document/nodes/note.ts";
import { GroupNodeRegistryEntry } from "./document/nodes/group.ts";
import { assertEquals } from "@std/assert/equals";
import { assert } from "@std/assert/assert";
import { AddChildCommand } from "./document/commands/add_child.ts";
import { assertNotEquals } from "@std/assert/not-equals";
import { visit } from "./document/node_visit.ts";

Deno.test("Workspace", async (t) => {
	await t.step("test", async () => {
		const fs = new MemoryRootFolder();
		const repository = new Repository(fs);
		const cache = new NodeCache();
		const registry = new NodeRegistry();
		registry.register(NoteNodeRegistryEntry);
		registry.register(GroupNodeRegistryEntry);

		const workspace1 = await Workspace.init({
			cache,
			registry,
			repository,
		});
		await repository.setHead(workspace1.reference!);
		await workspace1.commitChanges({
			committer: "system",
			message: "Initial commit",
			date: new Date("2025-10-14T19:18:00.000Z"),
		});

		const workspace2 = await Workspace.checkout({
			cache,
			reference: "refs/heads/main",
			registry,
			repository,
		});
		assertEquals(workspace1, workspace2);

		const workspace3 = workspace2.execCommand(
			new AddChildCommand(workspace2.rootNode.id, NoteNode.new({ name: "README.md", content: "Hello, world!" })),
		);

		assertNotEquals(workspace2, workspace3);

		await workspace3.commitChanges({
			committer: "system",
			message: "Added README",
			date: new Date("2025-10-14T19:20:00.000Z"),
		});

		const workspace4 = await Workspace.checkout({
			cache,
			reference: "refs/heads/main",
			registry,
			repository,
		});
		assertEquals(workspace3, workspace4);

		visit(workspace4.rootNode, (node) => console.log(`${node.kind} ${node.name}`));
	});
});
