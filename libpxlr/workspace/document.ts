import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { Command, GroupNode, Node } from "../nodes/mod.ts";
import { Commit, Reference } from "../repository/mod.ts";
import { Workspace } from "./workspace.ts";

export class Document {
	#workspace: Workspace;
	#reference: Reference | undefined;
	#commit: Commit;
	#historyRoots: Node[];
	#historyCursor: number;
	constructor(workspace: Workspace, reference: Reference | undefined, commit: Commit, rootNode: Node) {
		this.#workspace = workspace;
		this.#reference = reference;
		this.#commit = commit;
		this.#historyRoots = [rootNode];
		this.#historyCursor = 0;
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
		return this.#historyRoots.at(this.#historyCursor)!;
	}

	undoCommand() {
		this.#historyCursor = Math.max(0, this.#historyCursor - 1);
	}

	redoCommand() {
		this.#historyCursor = Math.min(this.#historyRoots.length - 1, this.#historyCursor + 1);
	}

	getNodeByHash(hash: AutoId): Node | undefined {
		assertAutoId(hash);
		if (this.rootNode) {
			for (const node of this.rootNode) {
				if (node.hash === hash) {
					return node;
				}
			}
		}
	}

	getNodeById(id: AutoId): Node | undefined {
		assertAutoId(id);
		if (this.rootNode) {
			for (const node of this.rootNode) {
				if (node.id === id) {
					return node;
				}
			}
		}
	}

	getNodeAtNamePath(path: string[]): Node | undefined {
		if (this.rootNode && this.rootNode instanceof GroupNode) {
			return this.rootNode.getChildAtNamePath(path);
		}
	}

	executeCommand(command: Command): Document {
		const rootNode = this.rootNode.executeCommand(command);
		if (rootNode !== this.rootNode) {
			this.#historyRoots.push(rootNode);
			this.#historyCursor += 1;
			// TODO onChange callback
		}
		return this;
	}

	async commitChanges(author: string, message: string): Promise<Commit> {
		const oldRoot = this.#historyRoots.at(0);
		const newRoot = this.rootNode;
		if (!oldRoot || oldRoot === newRoot) {
			throw new NothingToCommitError();
		}

		const oldNodeSet = new Set();
		for (const node of oldRoot) {
			oldNodeSet.add(node.hash);
		}
		for (const node of newRoot) {
			if (!oldNodeSet.has(node.hash)) {
				await this.workspace.repository.writeObject(node.toObject());
			}
		}
		const commit = new Commit(autoid(), this.#commit!.hash, newRoot.hash, author, new Date(), message);
		await this.workspace.repository.writeCommit(commit);
		if (this.reference) {
			const reference = new Reference(this.reference.ref, commit.hash);
			await this.workspace.repository.writeReference(reference);
		}
		this.#commit = commit;
		this.#historyRoots.splice(0, this.#historyRoots.length, newRoot);
		this.#historyCursor = 0;
		return commit;
	}
}

export class NothingToCommitError extends Error {}