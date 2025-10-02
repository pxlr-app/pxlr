import { assertID, ID } from "./id.ts";

export abstract class Command {
	#hash: string;
	#target: string;
	public constructor(
		hash: string,
		target: string,
	) {
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
