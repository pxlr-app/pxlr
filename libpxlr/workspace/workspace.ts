import { assertAutoId, AutoId } from "../autoid.ts";
import { Node, NodeDeserializer, NodeNotFoundError, NodeRegistry, UnloadedNode } from "../nodes/mod.ts";
import { Repository, Tree } from "../repository/mod.ts";
import { Branch } from "./branch.ts";
import { Document } from "./document.ts";

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

	get repository(): Readonly<Repository> {
		return this.#repository;
	}

	get nodeRegistry(): Readonly<NodeRegistry> {
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
		for await (const ref of this.#repository.listReferencePath(`refs/heads`, abortSignal)) {
			yield decodeURIComponent(ref.split("/").slice(2).join("/"));
		}
	}

	async getBranch(name: string, abortSignal?: AbortSignal): Promise<Branch> {
		const reference = await this.repository.getReference(`refs/heads/${name}`, abortSignal);
		return new Branch(this, reference);
	}

	async getNodeByHash(hash: AutoId, shallow = true, abortSignal?: AbortSignal): Promise<Node> {
		assertAutoId(hash);
		const cachedNode = this.#nodeCache.get(hash);
		if (cachedNode) {
			const node = cachedNode.deref();
			if (node && !(node instanceof UnloadedNode)) {
				return node;
			}
		}
		let nodeConstructor: NodeDeserializer;
		const object = await this.#repository.getObject(hash, abortSignal);
		if (object.kind === "tree") {
			const tree = await Tree.fromObject(object);
			nodeConstructor = this.#nodeRegistry.getTreeConstructor(tree.subKind);
		} else {
			nodeConstructor = this.#nodeRegistry.getNodeConstructor(object.kind);
		}
		const node = await nodeConstructor({ object, getNodeByHash: this.getNodeByHash.bind(this), shallow, abortSignal });
		if (node) {
			this.#nodeCache.set(hash, new WeakRef(node));
			return node;
		}
		throw new NodeNotFoundError(hash);
	}

	async checkoutDocument(hash: AutoId, abortSignal?: AbortSignal): Promise<Document> {
		const commit = await this.repository.getCommit(hash, abortSignal);
		const rootNode = await this.getNodeByHash(commit.tree, true, abortSignal);
		return new Document(this, commit, rootNode);
	}
}