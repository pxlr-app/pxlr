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

export class Workspace {
	#repository: Repository;
	#registry: NodeRegistry;
	#cache: NodeCache;
	#history: NodeHistory;
	#ref: string;

	constructor(options: {
		repository: Repository;
		registry: NodeRegistry;
		history: NodeHistory;
		cache: NodeCache;
		ref: string;
	}) {
		this.#repository = options.repository;
		this.#registry = options.registry;
		this.#cache = options.cache;
		this.#history = options.history;
		this.#ref = options.ref;
	}

	get repository() {
		return this.#repository;
	}

	get registry() {
		return this.#registry;
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
			ref: "refs/heads/main",
		});
	}

	static async checkout(options: {
		repository: Repository;
		registry: NodeRegistry;
		ref: string;
		cache: NodeCache;
	}): Promise<Workspace> {
		throw "TODO!";
	}

	async commit(options: {
		author: string;
		message: string;
		allowEmpty?: boolean;
		abortSignal?: AbortSignal;
	}): Promise<void> {
		const current = this.history.current;
		assert(current instanceof GroupNode, "Current node must be a GroupNode");

		const nodes = visit(current, {
			leave: (node, ctx) => {
				ctx.push(node);
			},
		}, [] as Node[]);

		const idToHash = new Map<ID, string>();
		let emptyCommit = true;

		for (const node of nodes) {
			const registryEntry = this.registry.get(node.kind);
			const object = await registryEntry.serialize({ node, getObjectHashByNodeId: (id) => idToHash.get(id) });
			idToHash.set(node.id, object.hash);
			if (!await this.repository.hasObject(object.hash, options.abortSignal)) {
				await this.repository.setObject(object, options.abortSignal);
				emptyCommit = false;
			}
		}

		if (emptyCommit && !options.allowEmpty) {
			throw new NothingToCommitError();
		}

		// TODO on what ref are we pointing to?
		// TODO create new commit
		// TODO move ref to new commit

		// const commit = Commit.new({
		// 	parent: idToHash.get(current.id)!,
		// })

		throw "TODO!";
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
