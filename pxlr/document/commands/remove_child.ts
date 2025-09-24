import { assertID, ID } from "../id.ts";
import { Command } from "../command.ts";

export class RemoveChildCommand extends Command {
	#childHash: ID;
	public constructor(hash: ID, target: ID, childHash: ID) {
		super(hash, target);
		assertID(childHash);
		this.#childHash = childHash;
	}

	get childHash() {
		return this.#childHash;
	}
}
