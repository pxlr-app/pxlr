import { assertAutoId, AutoId } from "../autoid.ts";
import { Node } from "./node.ts";
import { assertReference, Reference, Repository, Tree } from "../repository/mod.ts";
import { NodeConstructor, Registry, UnloadedNode } from "./mod.ts";
import { NodeCache } from "./cache.ts";

export class Document {
	protected constructor(
		protected readonly repository: Repository,
		protected readonly registry: Registry,
		protected readonly cache: NodeCache,
		protected reference?: Reference,
	) {
		reference && assertReference(reference);
	}

	// deno-lint-ignore require-await
	static async create(repository: Repository, registry: Registry, cache: NodeCache): Promise<Document> {
		return new Document(repository, registry, cache);
	}

	static async loadAtHead(repository: Repository, registry: Registry, cache: NodeCache): Promise<Document> {
		const reference = await repository.getHead();
		return this.loadAtRef(repository, registry, cache, reference);
	}

	// deno-lint-ignore require-await
	static async loadAtRef(repository: Repository, registry: Registry, cache: NodeCache, reference: Reference): Promise<Document> {
		assertReference(reference);
		return new Document(repository, registry, cache, reference);
	}

	async #getNode(id: AutoId, unloaded = false): Promise<Node> {
		assertAutoId(id);
		const cachedNode = this.cache.get(id);
		if (cachedNode) {
			return cachedNode;
		}
		let nodeConstructor: NodeConstructor;
		const object = await this.repository.getObject(id);
		if (unloaded) {
			nodeConstructor = UnloadedNode;
		} else if (object.kind === "tree") {
			const tree = await Tree.fromObject(object);
			nodeConstructor = this.registry.getTreeConstructor(tree.subKind);
		} else {
			nodeConstructor = this.registry.getNodeConstructor(object.kind);
		}
		const node = await nodeConstructor.fromObject(object, this);
		if (node) {
			this.cache.set(id, node);
			return node;
		}
		throw new NodeNotFoundError(id);
	}

	getNode(id: AutoId): Promise<Node> {
		return this.#getNode(id, false);
	}

	getUnloadedNode(id: AutoId): Promise<UnloadedNode> {
		return this.#getNode(id, true) as Promise<UnloadedNode>;
	}
}

export class NodeNotFoundError extends Error {
	public name = "NodeNotFoundError";
	public constructor(id: string) {
		super(`Could not find node ${id} in document.`);
	}
}
