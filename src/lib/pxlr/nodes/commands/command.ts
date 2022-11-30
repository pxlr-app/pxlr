import { assertAutoId, AutoId } from "../../autoid";

export abstract class Command {
	#hash: AutoId;
	#target: AutoId;
	public constructor(
		hash: AutoId,
		target: AutoId,
	) {
		assertAutoId(hash);
		assertAutoId(target);
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
