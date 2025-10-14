import { MemoryRootFolder } from "@pxlr/vfs/memory";
import { Repository } from "./repository/repository.ts";
import { Workspace } from "./workspace.ts";
import { NodeRegistry } from "./document/node_registry.ts";
import { NodeCache } from "./document/node_cache.ts";
import { NoteNodeRegistryEntry } from "./document/nodes/note.ts";
import { GroupNodeRegistryEntry } from "./document/nodes/group.ts";
import { assert } from "@std/assert/assert";

Deno.test("Workspace", async (t) => {
	await t.step("test", async () => {
		const fs = new MemoryRootFolder();
		const repository = new Repository(fs);
		const cache = new NodeCache();
		const registry = new NodeRegistry();
		registry.register(NoteNodeRegistryEntry);
		registry.register(GroupNodeRegistryEntry);
		const workspace = await Workspace.init({
			repository,
			registry,
			cache,
		});
		await repository.setHead(workspace.reference!);
		await workspace.commitChanges({
			committer: "system",
			message: "Initial commit",
		});
		assert(workspace.commit);
	});
});
