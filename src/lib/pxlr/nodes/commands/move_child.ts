import { assertAutoId, AutoId } from "../../autoid";
import { Command } from "./command";

export class MoveChildCommand extends Command {
	#childHash: AutoId;
	#position: number;
	public constructor(
		hash: AutoId,
		target: AutoId,
		childHash: AutoId,
		position: number,
	) {
		super(hash, target);
		assertAutoId(childHash);
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
