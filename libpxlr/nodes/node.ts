import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { Object } from "../repository/object.ts";
import { Tree } from "../repository/tree.ts";
import { Command, MoveChildCommand, RemoveChildCommand, RenameCommand, ReplaceNodeCommand } from "./commands/mod.ts";
import { Document } from "./document.ts";

export abstract class Node {
	public constructor(
		public readonly id: AutoId,
		public readonly kind: string,
		public readonly name: string,
	) {
		assertAutoId(id);
	}

	*iter(): IterableIterator<Node> {
		yield this;
	}
	[Symbol.iterator](): Iterator<Node> {
		return this.iter();
	}
	abstract executeCommand(command: Command): Node;
	abstract toObject(): Object;
}

export class UnloadedNode extends Node {
	public constructor(
		id: string,
		kind: string,
		name: string,
		public readonly children: ReadonlyArray<Node>,
	) {
		super(id, kind, name);
	}

	static new(kind: string, name: string, children: Node[]) {
		return new UnloadedNode(autoid(), kind, name, children);
	}

	executeCommand(command: Command): Node {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				return new UnloadedNode(autoid(), this.kind, command.renameTo, this.children);
			} else if (command instanceof RemoveChildCommand) {
				const childIndex = this.children.findIndex((node) => node.id === command.childId);
				if (childIndex > -1) {
					const children = [
						...this.children.slice(0, childIndex),
						...this.children.slice(childIndex + 1),
					];
					return new UnloadedNode(autoid(), this.kind, this.name, children);
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
					return new UnloadedNode(autoid(), this.kind, this.name, children);
				}
				return this;
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
			throw new UnloadedNodeMethodError();
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
			return new UnloadedNode(command instanceof ReplaceNodeCommand ? this.id : autoid(), this.kind, this.name, children);
		}
		return this;
	}

	toObject(): Object {
		throw new UnloadedNodeMethodError();
	}

	static async fromObject(object: Object, document: Document): Promise<Node> {
		if (object.kind !== "tree") {
			return new UnloadedNode(object.id, object.kind, object.headers.get("name") ?? "", []);
		}
		const tree = await Tree.fromObject(object);
		const children: UnloadedNode[] = [];
		for (const item of tree.items) {
			const node = await document.getUnloadedNode(item.id);
			children.push(node);
		}
		return new UnloadedNode(tree.id, tree.subKind, tree.name, children);
	}
}

export class UnloadedNodeMethodError extends Error {
	public name = "UnloadedNodeMethodError";
}
