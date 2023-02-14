import { assertAutoId, AutoId } from "../../autoid.ts";
import { Command } from "./command.ts";

export class RemoveChildCommand extends Command {
	#childHash: AutoId;
	public constructor(hash: AutoId, target: AutoId, childHash: AutoId) {
		super(hash, target);
		assertAutoId(childHash);
		this.#childHash = childHash;
	}

	get childHash() {
		return this.#childHash;
	}
}
