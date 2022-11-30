import { assertAutoId, AutoId } from "../../autoid";
import { Command } from "./command";

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
