import { AutoId, isAutoid } from "../autoid.ts";
import { Command } from "../commands/mod.ts";
import { Object } from "../objects/object.ts";

export abstract class Node<O extends Object> {
	#id: string;
	#name: string;
	#kind: string;

	public constructor(
		id: AutoId,
		kind: string,
		name: string,
	) {
		if (!isAutoid(id)) {
			throw new TypeError(`Parameter "id" does not appear to be an AutoId.`);
		}
		this.#id = id;
		this.#kind = kind.toString();
		this.#name = name.toString();
	}

	get id() {
		return this.#id;
	}

	get name() {
		return this.#name;
	}

	get kind() {
		return this.#kind;
	}

	*iter(): IterableIterator<Node<any>> {
		yield this;
	}
	[Symbol.iterator](): Iterator<Node<any>> {
		return this.iter();
	}
	abstract executeCommand(command: Command): Node<O>;
	abstract toObject(): O;
}
