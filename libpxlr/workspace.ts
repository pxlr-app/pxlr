import { assertAutoId, AutoId } from "./autoid.ts";
import { Command, GroupNode } from "./nodes/mod.ts";
import { Node, NodeNotFoundError, UnloadedNode } from "./nodes/node.ts";
import { NodeDeserializer, NodeRegistry } from "./nodes/registry.ts";
import { Commit, Tree } from "./repository/mod.ts";
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

	async *listBranches(abortSignal?: AbortSignal): AsyncIterableIterator<string> {
		for await (const ref of this.#repository.listReference(`refs/heads`, abortSignal)) {
			yield decodeURIComponent(ref.split("/").slice(2).join("/"));
		}
	}

	async getBranch(name: string, abortSignal?: AbortSignal): Promise<Branch> {
		const headId = await this.#repository.getReference(`refs/heads/${encodeURIComponent(name)}`, abortSignal);
		const headCommit = await this.#repository.getCommit(headId, abortSignal);
		return new Branch(this, name, headCommit);
	}

	async getDetachedBranch(id: AutoId, abortSignal?: AbortSignal): Promise<Branch> {
		const commit = await this.#repository.getCommit(id, abortSignal);
		return new Branch(this, undefined, commit);
	}

	async getNodeById(id: AutoId, shallow = true, abortSignal?: AbortSignal): Promise<Node> {
		assertAutoId(id);
		const cachedNode = this.#nodeCache.get(id);
		if (cachedNode) {
			const node = cachedNode.deref();
			if (node && !(node instanceof UnloadedNode)) {
				return node;
			}
		}
		let nodeConstructor: NodeDeserializer;
		const object = await this.#repository.getObject(id, abortSignal);
		if (object.kind === "tree") {
			const tree = await Tree.fromObject(object);
			nodeConstructor = this.#nodeRegistry.getTreeConstructor(tree.subKind);
		} else {
			nodeConstructor = this.#nodeRegistry.getNodeConstructor(object.kind);
		}
		const node = await nodeConstructor({ object, workspace: this, shallow, abortSignal });
		if (node) {
			this.#nodeCache.set(id, new WeakRef(node));
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
	#name: string | undefined;
	#headCommit: Commit;
	#history: Commit[];
	constructor(workspace: Workspace, name: string | undefined, headCommit: Commit) {
		this.#workspace = workspace;
		this.#name = name;
		this.#headCommit = headCommit;
		this.#history = [headCommit];
	}

	get workspace() {
		return this.#workspace;
	}

	get name() {
		return this.#name;
	}

	get isDetached() {
		return this.#name === undefined;
	}

	async *walkHistory(abortSignal?: AbortSignal): AsyncIterableIterator<Commit> {
		let lastCommitId: AutoId = "";
		for (const commit of this.#history) {
			yield commit;
			lastCommitId = commit.parent;
		}
		if (lastCommitId) {
			for await (const commit of this.#workspace.repository.iterHistory(lastCommitId, abortSignal)) {
				yield commit;
				this.#history.push(commit);
			}
		}
	}

	async checkoutDocument(abortSignal?: AbortSignal): Promise<Document> {
		const rootNode = await this.#workspace.getNodeById(this.#headCommit.tree, true, abortSignal);
		return new Document(this, this.#headCommit, rootNode);
	}
}

export class Document {
	#branch: Branch;
	#commit: Commit;
	#rootNode: Node;
	constructor(branch: Branch, commit: Commit, rootNode: Node) {
		this.#branch = branch;
		this.#commit = commit;
		this.#rootNode = rootNode;
	}

	get branch() {
		return this.#branch;
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
	async executeCommand(command: Command): Promise<Document> {
		const rootNode = this.#rootNode.executeCommand(command);
		if (rootNode && rootNode !== this.#rootNode) {
			let changed = false;
			const oldNodeSet = new Set();
			for (const node of this.#rootNode) {
				oldNodeSet.add(node.id);
			}
			for (const node of rootNode) {
				if (!oldNodeSet.has(node.id)) {
					changed = true;
					// await this.#repository.setObject(node.toObject());
				}
			}
			if (changed) {
				// const commit = new Commit(autoid(), this.#commit!.id, rootNode.id, "Bob <bob@test.local>", new Date(), "...");
				// await this.#repository.setCommit(commit);
				// await this.#repository.setReference(this.#reference, commit.id);
				// this.#commit = commit;
				// TODO onChange callback
			}
			this.#rootNode = rootNode;
		}
		return this;
	}
}
