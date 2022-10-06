import { AutoId, autoid, isAutoid } from "../autoid.ts";
import { Object } from "../object.ts";
import { Node } from "./mod.ts";

export class GroupNode implements Node {
	#id: string;
	#name: string;
	#children: Node[];

	public constructor(
		id: string,
		name: string,
		children: Node[],
	) {
		if (!isAutoid(id)) {
			throw new TypeError(`Parameter "id" does not appear to be an AutoId.`);
		}
		this.#id = id;
		this.#name = name;
		this.#children = [...children];
	}

	static new(name: string, children: Node[]) {
		return new GroupNode(autoid(), name, children);
	}

	get id() {
		return this.#id;
	}

	get name() {
		return this.#name;
	}

	setName(name: string) {
		return new GroupNode(autoid(), name, this.#children);
	}

	get children() {
		return this.#children;
	}

	addChild(node: Node) {
		const children = Array.from(new Set(this.#children.concat(node)));
		return new GroupNode(autoid(), this.#name, children);
	}

	removeChild(id: AutoId) {
		const childIndex = this.#children.findIndex(node => node.id === id);
		if (childIndex > -1) {
			const children = [
				...this.#children.slice(0, childIndex),
				...this.#children.slice(childIndex + 1)
			];
			return new GroupNode(autoid(), this.#name, children);
		}
		return this;
	}

	moveChild(id: AutoId, position: number) {
		const childIndex = this.#children.findIndex(node => node.id === id);
		if (childIndex > -1) {
			const child = this.#children.at(childIndex)!;
			const children = [
				...this.#children.slice(0, position),
				child,
				...this.#children.slice(position + 1)
			];
			return new GroupNode(autoid(), this.#name, children);
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
		return Object.new(this.#id, "group", { name: this.name }, this.#children.map(node => node.id).join(`\n`));
	}
}
