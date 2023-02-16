import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { AddChildCommand } from "../commands/add_child.ts";
import { Command } from "../commands/command.ts";
import { MoveChildCommand } from "../commands/move_child.ts";
import { RemoveChildCommand } from "../commands/remove_child.ts";
import { RenameCommand } from "../commands/rename.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { Tree } from "../../librepo/tree.ts";
import { Node } from "./node.ts";
import { NodeRegistryEntry } from "./registry.ts";
import { UnloadedNode } from "./node.ts";

export const GroupNodeRegistryEntry = new NodeRegistryEntry<GroupNode>(
	"Group",
	async ({ object, getNodeByHash, shallow, abortSignal }) => {
		const tree = await Tree.fromObject(object);
		const children: Node[] = [];
		for (const item of tree.items) {
			let node: Node;
			if (item.kind === "tree") {
				node = await getNodeByHash(item.hash, shallow, abortSignal);
			} else if (shallow) {
				node = new UnloadedNode(item.hash, item.id, item.kind, item.name);
			} else {
				node = await getNodeByHash(item.hash, false, abortSignal);
			}
			children.push(node);
		}
		return new GroupNode(tree.hash, tree.id, tree.name, children);
	},
	(node) => {
		return new Tree(
			node.hash,
			node.id,
			"Group",
			node.name,
			node.children.map((node) => ({
				hash: node.hash,
				id: node.id,
				kind: node.kind,
				name: node.name,
			})),
		).toObject();
	},
);

export class GroupNode extends Node {
	#children: ReadonlyArray<Node>;
	public constructor(
		hash: AutoId,
		id: AutoId,
		name: string,
		children: ReadonlyArray<Node>,
	) {
		super(hash, id, "Group", name);
		this.#children = children;
	}

	get children() {
		return this.#children;
	}

	static new(name: string, children: Node[]) {
		return new GroupNode(autoid(), autoid(), name, children);
	}

	*iter(): Iterator<Node> {
		yield* this.children;
	}

	dispatch(command: Command): Node {
		if (command.target === this.hash) {
			if (command instanceof RenameCommand) {
				if (command.renameTo === this.name) {
					return this;
				}
				return new GroupNode(
					autoid(),
					this.id,
					command.renameTo,
					this.children,
				);
			} else if (command instanceof AddChildCommand) {
				const name = command.childNode.name;
				if (this.children.find((child) => child.name === name)) {
					throw new ChildWithNameExistsError(name);
				}
				const id = command.childNode.id;
				if (this.children.find((child) => child.id === id)) {
					throw new ChildWithIdExistsError(id);
				}
				if (this.children.find((child) => child === command.childNode)) {
					return this;
				}
				const children = Array.from(
					new Set(this.children.concat(command.childNode)),
				);
				return new GroupNode(
					autoid(),
					this.id,
					this.name,
					children,
				);
			} else if (command instanceof RemoveChildCommand) {
				const childIndex = this.children.findIndex((node) => node.id === command.childHash);
				if (childIndex === -1) {
					return this;
				}
				const children = [
					...this.children.slice(0, childIndex),
					...this.children.slice(childIndex + 1),
				];
				return new GroupNode(
					autoid(),
					this.id,
					this.name,
					children,
				);
			} else if (command instanceof MoveChildCommand) {
				const childIndex = this.children.findIndex((node) => node.id === command.childHash);
				if (childIndex === -1) {
					return this;
				}
				const children = Array.from(this.children);
				const child = children.splice(childIndex, 1)[0];
				if (command.position > children.length) {
					children.push(child);
				} else {
					children.splice(command.position, 0, child);
				}
				return new GroupNode(
					autoid(),
					this.id,
					this.name,
					children,
				);
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
			return this;
		}
		if (
			command instanceof RenameCommand &&
			this.children.find((child) => child.hash === command.target)
		) {
			const name = command.renameTo;
			if (this.children.find((child) => child.name === name)) {
				throw new ChildWithNameExistsError(name);
			}
		}
		let mutated = false;
		const children = this.children.map((node) => {
			const newNode = node.dispatch(command);
			if (newNode !== node) {
				mutated = true;
			}
			return newNode;
		});
		if (mutated) {
			return new GroupNode(
				command instanceof ReplaceNodeCommand ? this.hash : autoid(),
				this.id,
				this.name,
				children,
			);
		}
		return this;
	}

	addChild(childNode: Node): AddChildCommand {
		return new AddChildCommand(autoid(), this.hash, childNode);
	}

	moveChild(childHash: AutoId, position: number): MoveChildCommand {
		return new MoveChildCommand(autoid(), this.hash, childHash, position);
	}

	removeChild(childHash: AutoId): RemoveChildCommand {
		return new RemoveChildCommand(autoid(), this.hash, childHash);
	}

	getChildByHash(hash: AutoId): Node | undefined {
		assertAutoId(hash);
		return this.children.find((child) => child.hash === hash);
	}

	getChildById(id: AutoId): Node | undefined {
		assertAutoId(id);
		return this.children.find((child) => child.id === id);
	}

	getChildByName(name: string): Node | undefined {
		return this.children.find((child) => child.name === name);
	}

	getChildAtNamePath(path: string[]): Node | undefined {
		const name = path.shift();
		if (name) {
			const next = this.getChildByName(name);
			if (path.length === 0) {
				return next;
			} else if (next && next instanceof GroupNode) {
				return next.getChildAtNamePath(path);
			}
		}
	}
}

export class ChildWithNameExistsError extends Error {
	public name = "ChildWithNameExistsError";
	public constructor(name: string) {
		super(`Child with name "${name}" already exists.`);
	}
}

export class ChildWithIdExistsError extends Error {
	public name = "ChildWithIdExistsError";
	public constructor(id: AutoId) {
		super(`Child with Id "${id}" already exists.`);
	}
}
