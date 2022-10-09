import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { Object } from "../repository/object.ts";
import { Tree } from "../repository/tree.ts";
import { Command, RenameCommand } from "./commands/mod.ts";
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
		public readonly children: ReadonlyArray<UnloadedNode>,
	) {
		super(id, kind, name);
	}

	static new(kind: string, name: string, children: UnloadedNode[]) {
		return new UnloadedNode(autoid(), kind, name, children);
	}

	executeCommand(command: Command) {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				return new UnloadedNode(autoid(), this.kind, command.renameTo, this.children);
			}
			return this;
		}
		return this;
	}

	toObject(): Object {
		throw new UnloadedNodeToObjectError();
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

export class UnloadedNodeToObjectError extends Error {
	public name = "UnloadedNodeToObjectError";
}
