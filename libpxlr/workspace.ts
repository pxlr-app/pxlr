import { assertAutoId, AutoId } from "./autoid.ts";
import { Command, GroupNode } from "./nodes/mod.ts";
import { Node, NodeNotFoundError } from "./nodes/node.ts";
import { NodeConstructor, NodeRegistry } from "./nodes/registry.ts";
import { Commit, IOError, Tree } from "./repository/mod.ts";
import { Repository } from "./repository/repository.ts";

export class Workspace {
	#nodeCache: Map<AutoId, WeakRef<Node>>;
	#repository: Repository;
	#nodeRegistry: NodeRegistry;

	constructor({ repository, nodeRegistry }: {
		repository: Repository;
		nodeRegistry: NodeRegistry;
	}) {
		this.#repository = repository;
		this.#nodeRegistry = nodeRegistry;
		this.#nodeCache = new Map<AutoId, WeakRef<Node>>();
	}

	get repository() {
		return this.#repository;
	}

	get nodeRegistry() {
		return this.#nodeRegistry;
	}

	flushNodeFromCache() {
		this.#nodeCache.clear();
	}

	flushUnusedNodeFromCache() {
		const notReclaimed = Array.from(this.#nodeCache.entries()).filter(([_id, nodeRef]) => !!nodeRef.deref());
		this.#nodeCache = new Map(notReclaimed);
	}

	async *listBranches(): AsyncIterableIterator<string> {
		for await (const ref of this.#repository.listReference(`refs/heads`)) {
			yield decodeURIComponent(ref.split("/").slice(2).join("/"));
		}
	}

	async checkoutBranch(branchIdentifier: string): Promise<Branch> {
		try {
			const headId = await this.#repository.getReference(`refs/heads/${encodeURIComponent(branchIdentifier)}`);
			const headCommit = await this.#repository.getCommit(headId);
			const rootNode = await this.getNodeById(headCommit.tree, true);
			return new Branch(this, branchIdentifier, headCommit, rootNode);
		} catch (error) {
			if (error instanceof IOError) {
				throw new BranchNotFoundError(branchIdentifier);
			}
			throw error;
		}
	}

	getLog(id: AutoId, abortSignal?: AbortSignal): AsyncIterableIterator<Commit> {
		assertAutoId(id);
		return this.#repository.walkHistory(id, abortSignal);
	}

	async getNodeById(id: AutoId, shallow = true): Promise<Node> {
		assertAutoId(id);
		const cachedNode = this.#nodeCache.get(id);
		if (cachedNode) {
			const node = cachedNode.deref();
			if (node) {
				return node;
			}
		}
		let nodeConstructor: NodeConstructor;
		const object = await this.#repository.getObject(id);
		if (object.kind === "tree") {
			const tree = await Tree.fromObject(object);
			nodeConstructor = this.#nodeRegistry.getTreeConstructor(tree.subKind);
		} else {
			nodeConstructor = this.#nodeRegistry.getNodeConstructor(object.kind);
		}
		const node = await nodeConstructor.fromObject({ object, workspace: this, shallow });
		if (node) {
			if (!shallow) {
				this.#nodeCache.set(id, new WeakRef(node));
			}
			return node;
		}
		throw new NodeNotFoundError(id);
	}
}

export class BranchNotFoundError extends Error {
	public name = "BranchNotFoundError";
	public constructor(branch: string) {
		super(`Branch "${branch}" not found.`);
	}
}

export class Branch {
	#workspace: Workspace;
	#branch: string;
	#commit: Commit;
	#rootNode: Node | undefined;

	constructor(
		workspace: Workspace,
		branch: string,
		headCommit: Commit,
		rootNode: Node,
	) {
		this.#workspace = workspace;
		this.#branch = branch;
		this.#commit = headCommit;
		this.#rootNode = rootNode;
	}

	get commit() {
		return this.#commit;
	}

	get rootNode() {
		return this.#rootNode;
	}

	getNodeById(id: AutoId): Node | undefined {
		assertAutoId(id);
		if (this.#rootNode) {
			for (const node of this.#rootNode) {
				if (node.id === id) {
					return node;
				}
			}
		}
	}

	getNodeAtPath(path: string[]): Node | undefined {
		if (this.#rootNode && this.#rootNode instanceof GroupNode) {
			return this.#rootNode.getChildAtPath(path);
		}
	}

	// deno-lint-ignore require-await
	async executeCommand(command: Command): Promise<Branch> {
		const rootNode = this.#rootNode?.executeCommand(command);
		if (rootNode && rootNode !== this.#rootNode) {
			// // Linked to a reference
			// if (this.#reference) {
			// 	for (const node of rootNode) {
			// 		if (!this.#nodeMap.has(node.id)) {
			// 			await this.#repository.setObject(node.toObject());
			// 		}
			// 	}
			// 	const commit = new Commit(autoid(), this.#commit!.id, rootNode.id, "Bob <bob@test.local>", new Date(), "...");
			// 	await this.#repository.setCommit(commit);
			// 	await this.#repository.setReference(this.#reference, commit.id);
			// 	this.#commit = commit;
			// }
			this.#rootNode = rootNode;
			// this.#updateNodeMap();
			// TODO onChange callback
		}
		return this;
	}
}
