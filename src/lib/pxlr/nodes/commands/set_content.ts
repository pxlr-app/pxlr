import { AutoId } from "../../autoid";
import { Command } from "./command";

export class SetContentCommand extends Command {
	#newContent: string;
	public constructor(hash: AutoId, target: AutoId, newContent: string) {
		super(hash, target);
		this.#newContent = newContent;
	}

	get newContent() {
		return this.#newContent;
	}
}
