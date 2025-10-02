import { Command } from "../command.ts";

export class RemoveChildCommand extends Command {
	#childHash: string;
	public constructor(hash: string, target: string, childHash: string) {
		super(hash, target);
		this.#childHash = childHash;
	}

	get childHash() {
		return this.#childHash;
	}
}
