import { Command } from "./document/command.ts";
import { ID } from "./document/id.ts";
import { Node } from "./document/node.ts";
import { NodeCache } from "./document/node_cache.ts";
import { NodeHistory } from "./document/node_history.ts";
import { NodeRegistry } from "./document/node_registry.ts";
import { visit, VisitorResult } from "./document/node_visit.ts";
import { GroupNode } from "./document/nodes/group.ts";
import { Repository } from "./repository/repository.ts";
import { Tree } from "./repository/tree.ts";
import { Blob } from "./repository/blob.ts";
import { assert } from "@std/assert/assert";
import { Commit } from "./repository/commit.ts";
import { Reference } from "./repository/reference.ts";

export class Workspace {
	#repository: Repository;
	#registry: NodeRegistry;
	#cache: NodeCache;
	#history: NodeHistory;
	#commit: string | null;
	#reference: string | null;

	constructor(options: {
		repository: Repository;
		registry: NodeRegistry;
		history: NodeHistory;
		cache: NodeCache;
		commit: string | null;
		reference: string | null;
	}) {
		this.#repository = options.repository;
		this.#registry = options.registry;
		this.#cache = options.cache;
		this.#history = options.history;
		this.#commit = options.commit;
		this.#reference = options.reference;
	}

	get repository() {
		return this.#repository;
	}

	get registry() {
		return this.#registry;
	}

	get commit() {
		return this.#commit;
	}

	get reference() {
		return this.#reference;
	}

	get history() {
		return this.#history;
	}

	static async init(options: { repository: Repository; registry: NodeRegistry; cache: NodeCache }): Promise<Workspace> {
		const rootNode = GroupNode.new({ name: "Document" });
		const history = new NodeHistory([rootNode]);
		return new Workspace({
			repository: options.repository,
			registry: options.registry,
			history,
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
	}): Promise<Workspace> {
		throw "TODO!";
	}

	async commitChanges(options: {
		committer: string;
		message: string;
		allowEmpty?: boolean;
		abortSignal?: AbortSignal;
	}): Promise<void> {
		const current = this.history.current;
		assert(current instanceof GroupNode, "Current node must be a GroupNode");

		const idToHash = new Map<ID, string>();
		let emptyCommit = true;

		// TODO: parallelize this with Promise.allSettled
		// but limit concurrency to avoid too many open files
		// and too much memory usage

		// We do a post-order traversal to ensure children are processed before parents
		// so that parent hashes can be computed from child hashes
		// This way, we only need to store one hash per node in memory at a time
		const nodes = visit(current, {
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
			tree: idToHash.get(current.id)!,
			commiter: options.committer,
			date: new Date(),
			message: options.message,
		});
		const commitHash = await this.repository.setObject(commit, options.abortSignal);
		if (this.#reference) {
			await this.repository.setReference(this.#reference, new Reference(commitHash), options.abortSignal);
		}
		this.#commit = commitHash;
	}

	getNodeById(id: ID): Node | undefined {
		const head = this.history.head;
		if (!head) {
			return undefined;
		}
		const search = visit(head, (node, ctx) => {
			if (node.id === id) {
				ctx.result = node;
				return VisitorResult.Break;
			}
		}, { result: undefined } as { result?: Node });

		return search.result;
	}

	getNodeAtNamePath(path: string[]): Node | undefined {
		const head = this.history.head;
		if (head && head instanceof GroupNode) {
			return head.getChildAtNamePath(path);
		}
		return undefined;
	}

	execCommand(command: Command): Workspace {
		this.#history = this.#history.execCommand(command);
		return this;
	}
}

export class NothingToCommitError extends Error {}
