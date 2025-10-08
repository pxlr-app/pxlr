import { Command } from "../command.ts";
import { ID } from "../id.ts";

export class RenameCommand extends Command {
	#renameTo: string;
	public constructor(target: ID, renameTo: string) {
		super(target);
		this.#renameTo = renameTo;
	}

	get renameTo() {
		return this.#renameTo;
	}
}
