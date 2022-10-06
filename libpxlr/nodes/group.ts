import { autoid } from "../autoid.ts";
import { Object } from "../object.ts";
import { AddChildCommand, Command, MoveChildCommand, RemoveChildCommand, RenameCommand } from "../commands/mod.ts";
import { Node } from "./mod.ts";

export class GroupNode extends Node {
	#children: Node[];

	public constructor(
		id: string,
		name: string,
		children: Node[],
	) {
		super(id, name);
		this.#children = [...children];
	}

	static new(name: string, children: Node[]) {
		return new GroupNode(autoid(), name, children);
	}

	get children() {
		return this.#children;
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
		const children = this.#children.map(node => {
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

	// static async deserialize(object: Object) {
	// 	if (object.type !== "note") {
	// 		throw new TypeError(`Object's type is not a note, got ${object.type}.`);
	// 	}
	// 	return new GroupNode(object.id, object.headers.get("name") ?? "", await object.text());
	// }

	serializeToObject(): Object {
		return Object.new(this.id, "group", { name: this.name }, this.#children.map((node) => node.id).join(`\n`));
	}
}
