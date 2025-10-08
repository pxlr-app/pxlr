import { assertID, ID } from "./id.ts";

export abstract class Command {
	#target: ID;
	public constructor(
		target: ID,
	) {
		assertID(target);
		this.#target = target;
	}

	get target() {
		return this.#target;
	}
}
