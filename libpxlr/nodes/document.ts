import { assertAutoId, AutoId } from "../autoid.ts";
import { Node } from "./node.ts";
import { assertReference, Reference, Repository, Tree } from "../repository/mod.ts";
import { Registry } from "./mod.ts";
import { NodeConstructor } from "./registry.ts";

export class Document {
	#nodeCache = new Map<AutoId, WeakRef<Node>>();

	protected constructor(
		protected readonly repository: Repository,
		protected readonly registry: Registry,
		protected reference?: Reference,
	) {
		reference && assertReference(reference);
	}

	// deno-lint-ignore require-await
	static async create(repository: Repository, registry: Registry): Promise<Document> {
		return new Document(repository, registry);
	}

	static async loadAtHead(repository: Repository, registry: Registry): Promise<Document> {
		const reference = await repository.getHead();
		return this.loadAtRef(repository, registry, reference);
	}

	// deno-lint-ignore require-await
	static async loadAtRef(repository: Repository, registry: Registry, reference: Reference): Promise<Document> {
		assertReference(reference);
		return new Document(repository, registry, reference);
	}

	async getNode<T extends Node = Node>(id: AutoId, shallow = false): Promise<T> {
		assertAutoId(id);
		if (this.#nodeCache.has(id)) {
			const cachedNode = this.#nodeCache.get(id)!.deref();
			if (cachedNode) {
				return cachedNode as T;
			}
			this.#nodeCache.delete(id);
		}
		const object = await this.repository.getObject(id);
		try {
			let node: T;
			if (object.kind === "tree") {
				const tree = await Tree.fromObject(object);
				const treeConstructor = this.registry.getTreeConstructor(tree.subKind);
				node = await treeConstructor.fromObject(object, this, shallow) as T;
			} else {
				const nodeConstructor = this.registry.getNodeConstructor(object.kind);
				node = await nodeConstructor.fromObject(object, this) as T;
			}
			this.#nodeCache.set(id, new WeakRef(node));
			return node;
		} catch (_err) {}
		throw new NodeNotFoundError(id);
	}
}

export class NodeNotFoundError extends Error {
	public name = "NodeNotFoundError";
	public constructor(id: string) {
		super(`Could not find node ${id} in document.`);
	}
}
