import { Command } from "../command.ts";

export class MoveChildCommand extends Command {
	#childHash: string;
	#position: number;
	public constructor(
		hash: string,
		target: string,
		childHash: string,
		position: number,
	) {
		super(hash, target);
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
