import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { assertReference, Commit, Reference, Repository, Tree } from "../repository/mod.ts";
import { Command, Node, NodeConstructor, NodeNotFoundError, Registry, ReplaceNodeCommand } from "./mod.ts";
import { NodeCache } from "./cache.ts";
import { GroupNode } from "./group.ts";

export class Document {
	#repository: Repository;
	#registry: Registry;
	#cache: NodeCache;
	#rootNode: Node | undefined;
	#reference: Reference | undefined;
	#commit: Commit | undefined;
	#nodeMap: Map<string, Node>;

	constructor(
		{
			repository,
			registry,
			cache,
		}: {
			repository: Repository;
			registry: Registry;
			cache?: NodeCache;
		},
	) {
		this.#repository = repository;
		this.#registry = registry;
		this.#cache = cache ?? new NodeCache();
		this.#nodeMap = new Map();
	}

	get rootNode() {
		return this.#rootNode;
	}

	get reference() {
		return this.#reference;
	}

	get commit() {
		return this.#commit?.id;
	}

	#updateNodeMap() {
		this.#nodeMap.clear();
		if (this.#rootNode) {
			for (const node of this.#rootNode) {
				this.#nodeMap.set(node.id, node);
			}
		}
	}

	// deno-lint-ignore require-await
	async create(): Promise<void> {
		this.#rootNode = new GroupNode(autoid(), "", []);
		this.#reference = "refs/heads/main";
		this.#updateNodeMap();
	}

	async openAtHead(): Promise<void> {
		const reference = await this.#repository.getHead();
		return this.openAtRef(reference);
	}

	async openAtRef(reference: Reference): Promise<void> {
		assertReference(reference);
		const refId = await this.#repository.getReference(reference);
		this.#commit = await this.#repository.getCommit(refId);
		this.#rootNode = await this.#loadNodeById(this.#commit.tree, true);
		this.#reference = reference;
		this.#updateNodeMap();
	}

	async openAtCommit(id: AutoId): Promise<void> {
		assertAutoId(id);
		this.#commit = await this.#repository.getCommit(id);
		this.#rootNode = await this.#loadNodeById(this.#commit.tree, true);
		this.#reference = "";
		this.#updateNodeMap();
	}

	async #loadNodeById(id: AutoId, shallow = false): Promise<Node> {
		assertAutoId(id);
		const cachedNode = this.#cache.get(id);
		if (cachedNode) {
			return cachedNode;
		}
		let nodeConstructor: NodeConstructor;
		const object = await this.#repository.getObject(id);
		if (object.kind === "tree") {
			const tree = await Tree.fromObject(object);
			nodeConstructor = this.#registry.getTreeConstructor(tree.subKind);
		} else {
			nodeConstructor = this.#registry.getNodeConstructor(object.kind);
		}
		const node = await nodeConstructor.fromObject({ object, document: this, shallow });
		if (node) {
			if (!shallow) {
				this.#cache.set(id, node);
			}
			return node;
		}
		throw new NodeNotFoundError(id);
	}

	async load(): Promise<Node> {
		if (this.rootNode) {
			const root = await this.#loadNodeById(this.rootNode.id);
			await this.executeCommand(new ReplaceNodeCommand(root));
			return root;
		}
		throw new ReferenceError();
	}

	async loadNodeById(id: AutoId, shallow = false): Promise<Node> {
		const node = await this.#loadNodeById(id, shallow);
		await this.executeCommand(new ReplaceNodeCommand(node));
		return node;
	}

	getNodeById(id: AutoId): Node | undefined {
		assertAutoId(id);
		return this.#nodeMap.get(id);
	}

	async executeCommand(command: Command): Promise<Document> {
		const rootNode = this.#rootNode?.executeCommand(command);
		if (rootNode && rootNode !== this.#rootNode) {
			// Linked to a reference
			if (this.#reference) {
				for (const node of rootNode) {
					if (!this.#nodeMap.has(node.id)) {
						await this.#repository.setObject(node.toObject());
					}
				}
				const commit = new Commit(autoid(), this.#commit!.id, rootNode.id, "Bob <bob@test.local>", new Date(), "...");
				await this.#repository.setCommit(commit);
				await this.#repository.setReference(this.#reference, commit.id);
				this.#commit = commit;
			}
			this.#rootNode = rootNode;
			this.#updateNodeMap();
			// TODO onChange callback
		}
		return this;
	}
}
