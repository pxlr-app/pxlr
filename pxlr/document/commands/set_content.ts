import { ID } from "../id.ts";
import { Command } from "../command.ts";

export class SetContentCommand extends Command {
	#newContent: string;
	public constructor(hash: ID, target: ID, newContent: string) {
		super(hash, target);
		this.#newContent = newContent;
	}

	get newContent() {
		return this.#newContent;
	}
}
