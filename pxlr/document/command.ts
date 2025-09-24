import { assertID, ID } from "./id.ts";

export abstract class Command {
	#hash: ID;
	#target: ID;
	public constructor(
		hash: ID,
		target: ID,
	) {
		assertID(hash);
		assertID(target);
		this.#hash = hash;
		this.#target = target;
	}

	get hash() {
		return this.#hash;
	}

	get target() {
		return this.#target;
	}
}
