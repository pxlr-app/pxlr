import { assertID, ID } from "./id.ts";

export abstract class Command {
	#target: string;
	public constructor(
		target: string,
	) {
		assertID(target);
		this.#target = target;
	}

	get target() {
		return this.#target;
	}
}
