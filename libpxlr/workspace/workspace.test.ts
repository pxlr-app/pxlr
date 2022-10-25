import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { BufferedRepository, Commit, MemoryFilesystem, Reference, Tree } from "../repository/mod.ts";
import { GroupNode, GroupNodeRegistryEntry, NodeRegistry, NoteNode, NoteNodeRegistryEntry } from "../nodes/mod.ts";
import { Workspace } from "./workspace.ts";
import { autoid } from "../autoid.ts";

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

	await t.step("checkoutDocument", async () => {
		const fs = new MemoryFilesystem();
		const repository = new BufferedRepository(fs);
		const note = new NoteNode(autoid(), autoid(), "My Note", "...");
		const root = new GroupNode(autoid(), autoid(), "", [note]);
		const tree = new Tree(autoid(), autoid(), "group", "", []);
		const commit = new Commit(autoid(), autoid(), root.id, "Test <test@test.local>", new Date(), "");
		await repository.writeObject(note.toObject());
		await repository.writeObject(root.toObject());
		await repository.writeTree(tree);
		await repository.writeCommit(commit);
		await repository.writeReference(new Reference("refs/heads/main", commit.hash));
		const workspace = new Workspace({ repository, nodeRegistry });
		const document = await workspace.checkoutDocument(commit.hash)
		assertEquals(document.commit.hash, commit.hash);
		console.log(inspect(document, { depth: 10 }));
	});
});

function inspect(value: unknown, options?: { depth?: number; indent?: string }) {
	const indent = options?.indent ?? "  ";
	const maxDepth = options?.depth ?? 10;
	return _inspect(value);
	function _inspect(value: unknown, depth = 0) {
		if (value === null) {
			return "null";
		} else if (value === undefined) {
				return "undefined";
		} else if (typeof value === "number") {
			return value.toString();
		} else if (typeof value === "boolean") {
			return value ? "true" : "false";
		} else if (typeof value === "string") {
			return `"${value.replaceAll('"', '\\"')}"`;
		} else if (value instanceof Date) {
			return value.toISOString();
		} else if (Array.isArray(value)) {
			let name = value.constructor.name;
			name = name === "Array" ? "" : `${name} `;
			if (value.length === 0) {
				return `${name}[0]`;
			} else if (depth > maxDepth) {
				return `${name}[${value.length}]`;
			} else {
				let out = `${name}[\n`;
				for (const val of value.values()) {
					out += `${indent.repeat(depth + 1)}${_inspect(val, depth + 1)},\n`;
				}
				out += `${indent.repeat(depth)}]`;
				return out;
			}
		} else if (typeof value === "object") {
			let name = value.constructor.name;
			name = name === "Object" ? "" : `${name} `;
			const obj = value as Record<string, unknown>;
			const propNames = new Set<string>();
			for (let proto = Object.getPrototypeOf(obj); proto; proto = Object.getPrototypeOf(proto)) {
				for (const key of Object.getOwnPropertyNames(proto)) {
					propNames.add(key);
				}
			}
			const props = Array.from(propNames).filter(n => n !== "constructor" && typeof obj[n] !== "function");
			if (props.length === 0) {
				return `${name}{}`;
			} else if (depth > maxDepth) {
				return `${name}{ ${props.length ? "…" : ""} }`;
			} else {
				let out = `${name}{\n`;
				for (const key of props) {
					out += `${indent.repeat(depth + 1)}${key}: ${_inspect(obj[key], depth + 1)},\n`;
				}
				out += `${indent.repeat(depth)}}`;
				return out;
			}
		}
	}
}