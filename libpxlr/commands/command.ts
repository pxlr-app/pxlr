import { AutoId, isAutoid } from "../autoid.ts";

export abstract class Command {
	#target: AutoId;

	public constructor(
		target: AutoId,
	) {
		if (!isAutoid(target)) {
			throw new TypeError(`Parameter "target" does not appear to be an AutoId.`);
		}
		this.#target = target;
	}

	get target() {
		return this.#target;
	}
}
