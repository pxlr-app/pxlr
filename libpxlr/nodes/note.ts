import { autoid, isAutoid } from "../autoid.ts";
import { Object } from "../object.ts";
import { Node } from "./mod.ts";

export class NoteNode implements Node {
	#id: string;
	#name: string;
	#content: string;

	public constructor(
		id: string,
		name: string,
		content: string,
	) {
		if (!isAutoid(id)) {
			throw new TypeError(`Parameter "id" does not appear to be an AutoId.`);
		}
		this.#id = id;
		this.#name = name;
		this.#content = content;
	}

	static new(name: string, content: string) {
		return new NoteNode(autoid(), name, content);
	}

	get id() {
		return this.#id;
	}

	get name() {
		return this.#name;
	}

	setName(name: string) {
		return new NoteNode(autoid(), name, this.#content);
	}

	get content() {
		return this.#content;
	}

	setContent(content: string) {
		return new NoteNode(autoid(), this.#name, content);
	}

	// static async deserialize(object: Object) {
	// 	if (object.type !== "note") {
	// 		throw new TypeError(`Object's type is not a note, got ${object.type}.`);
	// 	}
	// 	return new NoteNode(object.id, object.headers.get("name") ?? "", await object.text());
	// }

	serializeToObject(): Object {
		return Object.new(this.#id, "note", { name: this.name }, this.content);
	}
}
