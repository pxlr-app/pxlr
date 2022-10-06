import { autoid } from "../autoid.ts";
import { AddChildCommand, Command, MoveChildCommand, RemoveChildCommand, RenameCommand } from "../commands/mod.ts";
import { Node } from "./node.ts";
import { TreeObject } from "../objects/tree.ts";

export class GroupNode extends Node<TreeObject> {
	#children: Node<any>[];

	public constructor(
		id: string,
		name: string,
		children: Node<any>[],
	) {
		super(id, "group", name);
		this.#children = [...children];
	}

	static new(name: string, children: Node<any>[]) {
		return new GroupNode(autoid(), name, children);
	}

	get children(): ReadonlyArray<Node<any>> {
		return this.#children;
	}

	*iter(): IterableIterator<Node<any>> {
		yield this;
		for (const child of this.#children) {
			yield* child.iter();
		}
	}

	executeCommand(command: Command) {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				return new GroupNode(autoid(), command.renameTo, this.#children);
			} else if (command instanceof AddChildCommand) {
				const children = Array.from(new Set(this.#children.concat(command.child)));
				return new GroupNode(autoid(), this.name, children);
			} else if (command instanceof RemoveChildCommand) {
				const childIndex = this.#children.findIndex((node) => node.id === command.childId);
				if (childIndex > -1) {
					const children = [
						...this.#children.slice(0, childIndex),
						...this.#children.slice(childIndex + 1),
					];
					return new GroupNode(autoid(), this.name, children);
				}
			} else if (command instanceof MoveChildCommand) {
				const childIndex = this.#children.findIndex((node) => node.id === command.childId);
				if (childIndex > -1) {
					const child = this.#children.at(childIndex)!;
					const children = [
						...this.#children.slice(0, command.position),
						child,
						...this.#children.slice(command.position + 1),
					];
					return new GroupNode(autoid(), this.name, children);
				}
			}
			return this;
		}
		let mutated = false;
		const children = this.#children.map((node) => {
			const newNode = node.executeCommand(command);
			if (newNode !== node) {
				mutated = true;
			}
			return newNode;
		});
		if (mutated) {
			return new GroupNode(autoid(), this.name, children);
		}
		return this;
	}

	toObject() {
		return new TreeObject(this.id, "group", this.name, this.#children.map((child) => ({ id: child.id, kind: child.kind, name: child.name })));
	}
}
