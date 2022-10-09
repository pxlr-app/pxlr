import { assertAutoId, AutoId } from "../autoid.ts";
import { Node } from "./node.ts";
import { assertReference, Reference, Repository, Tree } from "../repository/mod.ts";
import { NodeConstructor, Registry } from "./mod.ts";

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
		let nodeConstructor: NodeConstructor;
		const object = await this.repository.getObject(id);
		if (object.kind === "tree") {
			const tree = await Tree.fromObject(object);
			nodeConstructor = this.registry.getTreeConstructor(tree.subKind);
		} else {
			nodeConstructor = this.registry.getNodeConstructor(object.kind);
		}
		const node = await nodeConstructor.fromObject(object, this, shallow) as T;
		if (node) {
			this.#nodeCache.set(id, new WeakRef(node));
			return node;
		}
		throw new NodeNotFoundError(id);
	}
}

export class NodeNotFoundError extends Error {
	public name = "NodeNotFoundError";
	public constructor(id: string) {
		super(`Could not find node ${id} in document.`);
	}
}
