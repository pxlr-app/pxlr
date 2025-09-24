import { assertID, ID } from "../id.ts";
import { Command } from "../command.ts";

export class MoveChildCommand extends Command {
	#childHash: ID;
	#position: number;
	public constructor(
		hash: ID,
		target: ID,
		childHash: ID,
		position: number,
	) {
		super(hash, target);
		assertID(childHash);
		this.#childHash = childHash;
		this.#position = position;
	}

	get childHash() {
		return this.#childHash;
	}

	get position() {
		return this.#position;
	}
}
