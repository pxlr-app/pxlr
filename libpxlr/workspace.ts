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
		for await (const ref of this.#repository.listReferencePath(`refs/heads`, abortSignal)) {
			yield decodeURIComponent(ref.split("/").slice(2).join("/"));
		}
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

export class Branch {

}