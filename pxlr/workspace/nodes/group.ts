import { assertID, ID, id } from "../id.ts";
import { AddChildCommand } from "../commands/add_child.ts";
import { Command } from "../command.ts";
import { MoveChildCommand } from "../commands/move_child.ts";
import { RemoveChildCommand } from "../commands/remove_child.ts";
import { RenameCommand } from "../commands/rename.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { Node, UnloadedNode } from "../node.ts";
import { NodeRegistryEntry } from "../node_registry.ts";

// export const GroupNodeRegistryEntry = new NodeRegistryEntry<GroupNode>(
// 	"Group",
// 	async ({ item, stream, getNodeByHash, shallow, abortSignal }) => {
// 		const tree = await Tree.fromStream(item.hash, stream);
// 		const children: Node[] = [];
// 		for (const item of tree.items) {
// 			let node: Node;
// 			if (item.kind === "tree") {
// 				node = await getNodeByHash(item.hash, shallow, abortSignal);
// 			} else if (shallow) {
// 				node = new UnloadedNode(item.hash, item.id, item.kind, item.name);
// 			} else {
// 				node = await getNodeByHash(item.hash, false, abortSignal);
// 			}
// 			children.push(node);
// 		}
// 		return new GroupNode(tree.hash, item.id, item.name, children);
// 	},
// 	(node) => {
// 		return new Tree(
// 			node.hash,
// 			"Group",
// 			node.children.map((node) => ({
// 				hash: node.hash,
// 				id: node.id,
// 				kind: node.kind,
// 				name: node.name,
// 			})),
// 		).toStream();
// 	},
// );

export class GroupNode extends Node {
	#children: ReadonlyArray<Node>;
	public constructor(
		hash: ID,
		id: ID,
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
		return new GroupNode(id(), id(), name, children);
	}

	override *iter(): Iterator<Node> {
		yield* this.children;
	}

	dispatch(command: Command): Node {
		if (command.target === this.hash) {
			if (command instanceof RenameCommand) {
				if (command.renameTo === this.name) {
					return this;
				}
				return new GroupNode(
					id(),
					this.id,
					command.renameTo,
					this.children,
				);
			} else if (command instanceof AddChildCommand) {
				const name = command.childNode.name;
				if (this.children.find((child) => child.name === name)) {
					throw new ChildWithNameExistsError(name);
				}
				const childId = command.childNode.id;
				if (this.children.find((child) => child.id === childId)) {
					throw new ChildWithIdExistsError(childId);
				}
				if (this.children.find((child) => child === command.childNode)) {
					return this;
				}
				const children = Array.from(
					new Set(this.children.concat(command.childNode)),
				);
				return new GroupNode(
					id(),
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
					id(),
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
					id(),
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
				command instanceof ReplaceNodeCommand ? this.hash : id(),
				this.id,
				this.name,
				children,
			);
		}
		return this;
	}

	addChild(childNode: Node): AddChildCommand {
		return new AddChildCommand(id(), this.hash, childNode);
	}

	moveChild(childHash: ID, position: number): MoveChildCommand {
		return new MoveChildCommand(id(), this.hash, childHash, position);
	}

	removeChild(childHash: ID): RemoveChildCommand {
		return new RemoveChildCommand(id(), this.hash, childHash);
	}

	getChildByHash(hash: ID): Node | undefined {
		assertID(hash);
		return this.children.find((child) => child.hash === hash);
	}

	getChildById(id: ID): Node | undefined {
		assertID(id);
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
	override name = "ChildWithNameExistsError";
	public constructor(name: string) {
		super(`Child with name "${name}" already exists.`);
	}
}

export class ChildWithIdExistsError extends Error {
	override name = "ChildWithIdExistsError";
	public constructor(id: ID) {
		super(`Child with Id "${id}" already exists.`);
	}
}
