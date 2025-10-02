import { Command } from "../command.ts";

export class SetContentCommand extends Command {
	#newContent: string;
	public constructor(hash: string, target: string, newContent: string) {
		super(hash, target);
		this.#newContent = newContent;
	}

	get newContent() {
		return this.#newContent;
	}
}
