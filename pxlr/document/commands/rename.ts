import { Command } from "../command.ts";

export class RenameCommand extends Command {
	#renameTo: string;
	public constructor(hash: string, target: string, renameTo: string) {
		super(hash, target);
		this.#renameTo = renameTo;
	}

	get renameTo() {
		return this.#renameTo;
	}
}
