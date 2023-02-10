import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { Command, GroupNode, Node, visit, VisitorResult } from "../nodes/mod.ts";
import { Commit, Reference } from "../../librepo/mod.ts";
import { Workspace } from "./workspace.ts";

export class Document {
	#workspace: Workspace;
	#reference: Reference | undefined;
	#commit: Commit;
	#historyRoots: Node[];
	#historyCursor: number;
	constructor(
		workspace: Workspace,
		reference: Reference | undefined,
		commit: Commit,
		rootNode: Node,
	) {
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
		this.#historyCursor = Math.min(
			this.#historyRoots.length - 1,
			this.#historyCursor + 1,
		);
	}

	getNodeByHash(hash: AutoId): Node | undefined {
		assertAutoId(hash);
		if (this.rootNode) {
			let result: Node | undefined;
			visit(this.rootNode, {
				enter(node) {
					if (node.hash === hash) {
						result = node;
						return VisitorResult.Break;
					}
					return VisitorResult.Continue;
				},
			});
			return result;
		}
	}

	getNodeById(id: AutoId): Node | undefined {
		assertAutoId(id);
		if (this.rootNode) {
			let result: Node | undefined;
			visit(this.rootNode, {
				enter(node) {
					if (node.id === id) {
						result = node;
						return VisitorResult.Break;
					}
					return VisitorResult.Continue;
				},
			});
			return result;
		}
	}

	getNodeAtNamePath(path: string[]): Node | undefined {
		if (this.rootNode && this.rootNode instanceof GroupNode) {
			return this.rootNode.getChildAtNamePath(path);
		}
	}

	dispatch(command: Command): Document {
		const rootNode = this.rootNode.dispatch(command);
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

		const oldNodeSet = new Set<Node>();
		visit(oldRoot, {
			enter: (node) => {
				oldNodeSet.add(node);
				return VisitorResult.Continue;
			},
		});
		const writeObjectPromises: Promise<void>[] = [];
		visit(newRoot, {
			enter: (node) => {
				if (oldNodeSet.has(node)) {
					return VisitorResult.Skip;
				}
				const nodeRegistryEntry = this.workspace.nodeRegistry.get(node.kind);
				writeObjectPromises.push(
					this.workspace.repository.writeObject(nodeRegistryEntry.serialize(node)),
				);
				return VisitorResult.Continue;
			},
		});
		await Promise.allSettled(writeObjectPromises);
		const commit = new Commit(
			autoid(),
			this.#commit!.hash,
			newRoot.hash,
			author,
			new Date(),
			message,
		);
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

export class NothingToCommitError extends Error { }
