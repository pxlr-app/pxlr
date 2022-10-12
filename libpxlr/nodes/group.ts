import { autoid } from "../autoid.ts";
import { AddChildCommand, Command, MoveChildCommand, RemoveChildCommand, RenameCommand, ReplaceNodeCommand } from "./commands/mod.ts";
import { Object } from "../repository/object.ts";
import { Tree } from "../repository/tree.ts";
import { Node } from "./node.ts";
import { Document } from "./document.ts";
import { NodeConstructorOptions } from "./registry.ts";
import { UnloadedNode } from "./mod.ts";

export class GroupNode extends Node {
	public constructor(
		id: string,
		name: string,
		public readonly children: ReadonlyArray<Node>,
	) {
		super(id, "group", name);
	}

	static new(name: string, children: Node[]) {
		return new GroupNode(autoid(), name, children);
	}

	*iter(): IterableIterator<Node> {
		yield this;
		for (const child of this.children) {
			yield* child.iter();
		}
	}

	executeCommand(command: Command): Node {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				return new GroupNode(autoid(), command.renameTo, this.children);
			} else if (command instanceof AddChildCommand) {
				const children = Array.from(new Set(this.children.concat(command.childNode)));
				return new GroupNode(autoid(), this.name, children);
			} else if (command instanceof RemoveChildCommand) {
				const childIndex = this.children.findIndex((node) => node.id === command.childId);
				if (childIndex > -1) {
					const children = [
						...this.children.slice(0, childIndex),
						...this.children.slice(childIndex + 1),
					];
					return new GroupNode(autoid(), this.name, children);
				}
				return this;
			} else if (command instanceof MoveChildCommand) {
				const childIndex = this.children.findIndex((node) => node.id === command.childId);
				if (childIndex > -1) {
					const children = Array.from(this.children);
					const child = children.splice(childIndex, 1)[0];
					if (command.position > children.length) {
						children.push(child);
					} else {
						children.splice(command.position, 0, child);
					}
					return new GroupNode(autoid(), this.name, children);
				}
				return this;
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
			return this;
		}
		let mutated = false;
		const children = this.children.map((node) => {
			const newNode = node.executeCommand(command);
			if (newNode !== node) {
				mutated = true;
			}
			return newNode;
		});
		if (mutated) {
			return new GroupNode(command instanceof ReplaceNodeCommand ? this.id : autoid(), this.name, children);
		}
		return this;
	}

	toObject(): Object {
		return new Tree(this.id, "group", this.name, this.children.map((node) => ({ id: node.id, kind: node.kind, name: node.name }))).toObject();
	}

	static async fromObject({ object, document, shallow }: NodeConstructorOptions): Promise<Node> {
		const tree = await Tree.fromObject(object);
		const children: Node[] = [];
		for (const item of tree.items) {
			let node: Node;
			if (item.kind === "tree") {
				node = await document.getNode(item.id, shallow);
			} else if (shallow) {
				node = new UnloadedNode(item.id, item.kind, item.name);
			} else {
				node = await document.getNode(item.id);
			}
			children.push(node);
		}
		return new GroupNode(tree.id, tree.name, children);
	}
}
