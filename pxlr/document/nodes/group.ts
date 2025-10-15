import { assertID, ID, id } from "../id.ts";
import { AddChildCommand } from "../commands/add_child.ts";
import { Command } from "../command.ts";
import { MoveChildCommand } from "../commands/move_child.ts";
import { RemoveChildCommand } from "../commands/remove_child.ts";
import { RenameCommand } from "../commands/rename.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { Node, UnloadedNode } from "../node.ts";
import { NodeRegistryEntry } from "../node_registry.ts";
import { ReadonlyVec2, Rect, Vec2 } from "@pxlr/math";
import { MoveCommand } from "../commands/move.ts";
import { Tree, TreeItem } from "../../repository/tree.ts";
import { assert } from "@std/assert/assert";

export const GroupNodeRegistryEntry = new NodeRegistryEntry<GroupNode>(
	"Group",
	async ({ abortSignal, getNodeByObjectHash, shallow, blob }) => {
		const tree = await Tree.fromBlob(blob);
		const id = tree.headers.get("id");
		const name = tree.headers.get("name");
		const kind = tree.headers.get("kind");
		const x = Number(tree.headers.get("x"));
		const y = Number(tree.headers.get("y"));
		assertID(id);
		assert(kind === "Group");
		assert(name);
		const children: Node[] = [];
		for (const item of tree.items) {
			let node: Node;
			if (item.kind === "tree") {
				node = await getNodeByObjectHash(item.hash, shallow, abortSignal);
			} else if (shallow) {
				node = new UnloadedNode(id, "Group", name);
			} else {
				node = await getNodeByObjectHash(item.hash, false, abortSignal);
			}
			children.push(node);
		}
		return new GroupNode(id, name, children, new Vec2(x, y));
	},
	({ node, getObjectHashByNodeId }) => {
		const rect = node.rect;
		const items = node.children.map((node) => ({
			hash: getObjectHashByNodeId(node.id),
			kind: node.kind,
			name: node.name,
		} as TreeItem));
		return new Tree({ kind: node.kind, id: node.id, name: node.name, x: rect.x.toString(), y: rect.y.toString() }, items);
	},
);

export class GroupNode extends Node {
	#children: ReadonlyArray<Node>;
	#position: ReadonlyVec2;
	public constructor(
		id: ID,
		name: string,
		children: ReadonlyArray<Node>,
		position: ReadonlyVec2,
	) {
		super(id, "Group", name);
		this.#children = children;
		this.#position = position;
	}

	get children() {
		return this.#children;
	}

	get rect() {
		return new Rect(this.#position.x, this.#position.y, 0, 0);
	}

	static new({
		name,
		children = [],
		position = Vec2.ZERO,
	}: {
		name: string;
		children?: Node[];
		position?: ReadonlyVec2;
	}) {
		return new GroupNode(id(), name, children, position);
	}

	override *iter(): Iterator<Node> {
		yield* this.children;
	}

	execCommand(command: Command): Node {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				if (command.renameTo === this.name) {
					return this;
				}
				return new GroupNode(
					this.id,
					command.renameTo,
					this.children,
					new Vec2(this.rect.x, this.rect.y),
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
					this.id,
					this.name,
					children,
					new Vec2(this.rect.x, this.rect.y),
				);
			} else if (command instanceof RemoveChildCommand) {
				const childIndex = this.children.findIndex((node) => node.id === command.child);
				if (childIndex === -1) {
					return this;
				}
				const children = [
					...this.children.slice(0, childIndex),
					...this.children.slice(childIndex + 1),
				];
				return new GroupNode(
					this.id,
					this.name,
					children,
					new Vec2(this.rect.x, this.rect.y),
				);
			} else if (command instanceof MoveChildCommand) {
				const childIndex = this.children.findIndex((node) => node.id === command.child);
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
					this.id,
					this.name,
					children,
					new Vec2(this.rect.x, this.rect.y),
				);
			} else if (command instanceof MoveCommand) {
				return new GroupNode(
					this.id,
					this.name,
					this.children,
					command.position,
				);
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
			return this;
		}
		if (
			command instanceof RenameCommand &&
			this.children.find((child) => child.id === command.target)
		) {
			const name = command.renameTo;
			if (this.children.find((child) => child.name === name)) {
				throw new ChildWithNameExistsError(name);
			}
		}
		let mutated = false;
		const children = this.children.map((node) => {
			const newNode = node.execCommand(command);
			if (newNode !== node) {
				mutated = true;
			}
			return newNode;
		});
		if (mutated) {
			return new GroupNode(
				this.id,
				this.name,
				children,
				new Vec2(this.rect.x, this.rect.y),
			);
		}
		return this;
	}

	moveTo(position: ReadonlyVec2): MoveCommand {
		return new MoveCommand(this.id, new Vec2().copy(position));
	}

	addChild(childNode: Node): AddChildCommand {
		return new AddChildCommand(this.id, childNode);
	}

	moveChild(child: ID, position: number): MoveChildCommand {
		return new MoveChildCommand(this.id, child, position);
	}

	removeChild(child: ID): RemoveChildCommand {
		return new RemoveChildCommand(this.id, child);
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
