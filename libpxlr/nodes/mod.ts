import { AutoId, isAutoid } from "../autoid.ts";
import { Command } from "../commands/mod.ts";
import { Object } from "../object.ts";

export abstract class Node {
	#id: string;
	#name: string;

	public constructor(
		id: AutoId,
		name: string,
	) {
		if (!isAutoid(id)) {
			throw new TypeError(`Parameter "id" does not appear to be an AutoId.`);
		}
		this.#id = id;
		this.#name = name.toString();
	}

	get id() {
		return this.#id;
	}

	get name() {
		return this.#name;
	}

	abstract executeCommand(command: Command): Node;
	abstract serializeToObject(): Object;
}
