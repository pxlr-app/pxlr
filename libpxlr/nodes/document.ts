import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { Node } from "./node.ts";
import { assertReference, Reference, Repository, Tree } from "../repository/mod.ts";
import { Command, NodeConstructor, Registry, ReplaceNodeCommand, UnloadedNode } from "./mod.ts";
import { NodeCache } from "./cache.ts";
import { GroupNode } from "./group.ts";

export class Document {
	#repository: Repository;
	#registry: Registry;
	#cache: NodeCache;
	#rootNode: Node | undefined;
	#reference: Reference | undefined;

	constructor(
		{
			repository,
			registry,
			cache,
		}: {
			repository: Repository;
			registry: Registry;
			cache: NodeCache;
		},
	) {
		this.#repository = repository;
		this.#registry = registry;
		this.#cache = cache;
	}

	get rootNode() {
		return this.#rootNode;
	}

	get reference() {
		return this.#reference;
	}

	// deno-lint-ignore require-await
	async create(): Promise<void> {
		this.#rootNode = new GroupNode(autoid(), "", []);
		this.#reference = "";
	}

	async open(): Promise<void> {
		const reference = await this.#repository.getHead();
		return this.openAtRef(reference);
	}

	async openAtRef(reference: Reference): Promise<void> {
		assertReference(reference);
		const refId = await this.#repository.getReference(reference);
		const commit = await this.#repository.getCommit(refId);
		this.#rootNode = await this.#getNode(commit.tree, true);
		this.#reference = reference;
	}

	async #getNode(id: AutoId, unloaded = false): Promise<Node> {
		assertAutoId(id);
		const cachedNode = this.#cache.get(id);
		if (cachedNode) {
			return cachedNode;
		}
		let nodeConstructor: NodeConstructor;
		const object = await this.#repository.getObject(id);
		if (unloaded === true) {
			nodeConstructor = UnloadedNode;
		} else if (object.kind === "tree") {
			const tree = await Tree.fromObject(object);
			nodeConstructor = this.#registry.getTreeConstructor(tree.subKind);
		} else {
			nodeConstructor = this.#registry.getNodeConstructor(object.kind);
		}
		const node = await nodeConstructor.fromObject(object, this);
		if (node) {
			if (!unloaded) {
				this.#cache.set(id, node);
			}
			return node;
		}
		throw new NodeNotFoundError(id);
	}

	async executeCommand(command: Command): Promise<Document> {
		const rootNode = this.#rootNode?.executeCommand(command);
		if (rootNode && rootNode !== this.#rootNode) {
			for (const node of rootNode) {
				if (!await this.#repository.objectExists(node.id)) {
					await this.#repository.setObject(node.toObject());
				}
			}
			// TODO onChange callback
			this.#rootNode = rootNode;
		}
		return this;
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
