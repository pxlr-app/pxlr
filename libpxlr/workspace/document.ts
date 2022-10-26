import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { Command, GroupNode, Node } from "../nodes/mod.ts";
import { Commit, Reference } from "../repository/mod.ts";
import { Workspace } from "./workspace.ts";

export class Document {
	#workspace: Workspace;
	#reference: Reference | undefined;
	#commit: Commit;
	#rootNode: Node;
	constructor(workspace: Workspace, reference: Reference | undefined, commit: Commit, rootNode: Node) {
		this.#workspace = workspace;
		this.#reference = reference;
		this.#commit = commit;
		this.#rootNode = rootNode;
	}

	get workspace() {
		return this.#workspace;
	}

	get reference() {
		return this.#reference;
	}

	get commit() {
		return this.#commit;
	}

	get rootNode() {
		return this.#rootNode;
	}

	getNodeByHash(hash: AutoId): Node | undefined {
		assertAutoId(hash);
		if (this.#rootNode) {
			for (const node of this.#rootNode) {
				if (node.hash === hash) {
					return node;
				}
			}
		}
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

	getNodeAtNamePath(path: string[]): Node | undefined {
		if (this.#rootNode && this.#rootNode instanceof GroupNode) {
			return this.#rootNode.getChildAtNamePath(path);
		}
	}

	async executeCommand(command: Command, author: string, message: string): Promise<Document> {
		const rootNode = this.#rootNode.executeCommand(command);
		if (rootNode && rootNode !== this.#rootNode) {
			let changed = false;
			const oldNodeSet = new Set();
			for (const node of this.#rootNode) {
				oldNodeSet.add(node.hash);
			}
			for (const node of rootNode) {
				if (!oldNodeSet.has(node.hash)) {
					changed = true;
					await this.workspace.repository.writeObject(node.toObject());
				}
			}
			if (changed) {
				const commit = new Commit(autoid(), this.#commit!.hash, rootNode.hash, author, new Date(), message);
				await this.workspace.repository.writeCommit(commit);
				if (this.reference) {
					const reference = new Reference(this.reference.ref, commit.hash);
					await this.workspace.repository.writeReference(reference);
				}
				this.#commit = commit;
				// TODO onChange callback
			}
			this.#rootNode = rootNode;
		}
		return this;
	}
}
