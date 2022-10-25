import { assertAutoId, AutoId } from "../autoid.ts";
import { Command, GroupNode, Node } from "../nodes/mod.ts";
import { Commit } from "../repository/mod.ts";
import { Branch } from "./branch.ts";
import { Workspace } from "./workspace.ts";

export class Document {
	#workspace: Workspace;
	#commit: Commit;
	#rootNode: Node;
	constructor(workspace: Workspace, commit: Commit, rootNode: Node) {
		this.#workspace = workspace;
		this.#commit = commit;
		this.#rootNode = rootNode;
	}

	get workspace() {
		return this.#workspace;
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

	getNodeAtIdPath(path: string[]): Node | undefined {
		if (this.#rootNode && this.#rootNode instanceof GroupNode) {
			return this.#rootNode.getChildAtIdPath(path);
		}
	}

	getNodeAtNamePath(path: string[]): Node | undefined {
		if (this.#rootNode && this.#rootNode instanceof GroupNode) {
			return this.#rootNode.getChildAtNamePath(path);
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