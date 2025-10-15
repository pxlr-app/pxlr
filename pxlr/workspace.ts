import { Command } from "./document/command.ts";
import { ID } from "./document/id.ts";
import { Node } from "./document/node.ts";
import { NodeCache } from "./document/node_cache.ts";
import { History } from "./history.ts";
import { NodeDeserializerOptions, NodeRegistry } from "./document/node_registry.ts";
import { visit, VisitorResult } from "./document/node_visit.ts";
import { GroupNode } from "./document/nodes/group.ts";
import { Repository } from "./repository/repository.ts";
import { assert } from "@std/assert/assert";
import { Commit } from "./repository/commit.ts";
import { Reference } from "./repository/reference.ts";

export class Workspace {
	#repository: Repository;
	#registry: NodeRegistry;
	#cache: NodeCache;
	#rootNode: GroupNode;
	#commit: string | null;
	#reference: string | null;

	constructor(options: {
		repository: Repository;
		registry: NodeRegistry;
		cache: NodeCache;
		rootNode: GroupNode;
		commit: string | null;
		reference: string | null;
	}) {
		this.#repository = options.repository;
		this.#registry = options.registry;
		this.#cache = options.cache;
		this.#rootNode = options.rootNode;
		this.#commit = options.commit;
		this.#reference = options.reference;
	}

	get repository() {
		return this.#repository;
	}

	get registry() {
		return this.#registry;
	}

	get rootNode() {
		return this.#rootNode;
	}

	get commit() {
		return this.#commit;
	}

	get reference() {
		return this.#reference;
	}

	static async init(options: { repository: Repository; registry: NodeRegistry; cache: NodeCache }): Promise<Workspace> {
		const rootNode = GroupNode.new({ name: "Workspace" });
		return new Workspace({
			repository: options.repository,
			registry: options.registry,
			rootNode,
			cache: options.cache,
			commit: null,
			reference: "refs/heads/main",
		});
	}

	static async checkout(options: {
		repository: Repository;
		registry: NodeRegistry;
		reference: string;
		cache: NodeCache;
		abortSignal?: AbortSignal;
	}): Promise<Workspace> {
		const reference = await options.repository.getReference(options.reference, options.abortSignal);
		assert(reference.kind === "hash", "Reference must be a hash");
		const commit = await options.repository.getCommit(reference.reference, options.abortSignal);
		const blob = await options.repository.getBlob(commit.tree, options.abortSignal);
		const deserializer: NodeDeserializerOptions = {
			abortSignal: options.abortSignal,
			shallow: false,
			blob,
			async getNodeByObjectHash(hash, _shallow, abortSignal) {
				const blob = await options.repository.getBlob(hash, abortSignal);
				const kind = blob.headers.get("kind");
				assert(kind, "Blob must have a kind");
				const registryEntry = options.registry.get(kind);
				assert(registryEntry, `No registry entry for kind ${kind}`);
				return registryEntry.deserialize({ ...deserializer, blob });
			},
		};
		const rootNode = await options.registry.get("Group").deserialize(deserializer);
		assert(rootNode instanceof GroupNode, "Root node must be a GroupNode");

		return new Workspace({
			repository: options.repository,
			registry: options.registry,
			rootNode,
			cache: options.cache,
			commit: reference.reference,
			reference: options.reference,
		});
	}

	async commitChanges(options: {
		committer: string;
		message: string;
		date?: Date;
		allowEmpty?: boolean;
		abortSignal?: AbortSignal;
	}): Promise<void> {
		const idToHash = new Map<ID, string>();
		let emptyCommit = true;

		// TODO: parallelize this with Promise.allSettled
		// but limit concurrency to avoid too many open files
		// and too much memory usage

		// We do a post-order traversal to ensure children are processed before parents
		// so that parent hashes can be computed from child hashes
		// This way, we only need to store one hash per node in memory at a time
		const nodes = visit(this.rootNode, {
			leave: (node, ctx) => {
				ctx.push(node);
			},
		}, [] as Node[]);

		for (const node of nodes) {
			const registryEntry = this.registry.get(node.kind);
			const object = await registryEntry.serialize({ node, getObjectHashByNodeId: (id) => idToHash.get(id) });
			const hash = await this.repository.getObjectHash(object, options.abortSignal);
			if (!await this.repository.hasObject(hash, options.abortSignal)) {
				await this.repository.unsafe_setObject(hash, object, options.abortSignal);
				emptyCommit = false;
			}
			idToHash.set(node.id, hash);
		}

		if (emptyCommit && !options.allowEmpty) {
			throw new NothingToCommitError();
		}

		const commit = new Commit({
			parent: this.#commit,
			tree: idToHash.get(this.rootNode.id)!,
			commiter: options.committer,
			date: options.date ?? new Date(),
			message: options.message,
		});
		const commitHash = await this.repository.setObject(commit, options.abortSignal);
		if (this.#reference) {
			await this.repository.setReference(this.#reference, new Reference(commitHash), options.abortSignal);
		}
		this.#commit = commitHash;
	}

	getNodeById(id: ID): Node | undefined {
		const search = visit(this.rootNode, (node, ctx) => {
			if (node.id === id) {
				ctx.result = node;
				return VisitorResult.Break;
			}
		}, { result: undefined } as { result?: Node });

		return search.result;
	}

	getNodeAtNamePath(path: string[]): Node | undefined {
		return this.rootNode.getChildAtNamePath(path);
	}

	execCommand(command: Command): Workspace {
		const newRoot = this.rootNode.execCommand(command);
		assert(newRoot instanceof GroupNode, "Root node must be a GroupNode");
		if (newRoot === this.rootNode) {
			return this;
		}
		return new Workspace({
			repository: this.repository,
			registry: this.registry,
			cache: this.#cache,
			rootNode: newRoot,
			commit: this.commit,
			reference: this.reference,
		});
	}
}

export class NothingToCommitError extends Error {}
