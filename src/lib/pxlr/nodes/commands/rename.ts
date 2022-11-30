import { AutoId } from "../../autoid";
import { Command } from "./command";

export class RenameCommand extends Command {
	#renameTo: string;
	public constructor(hash: AutoId, target: AutoId, renameTo: string) {
		super(hash, target);
		this.#renameTo = renameTo;
	}

	get renameTo() {
		return this.#renameTo;
	}
}
