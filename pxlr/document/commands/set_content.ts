import { Command } from "../command.ts";
import { ID } from "../id.ts";

export class SetContentCommand extends Command {
	#content: string;
	public constructor(target: ID, content: string) {
		super(target);
		this.#content = content;
	}

	get content() {
		return this.#content;
	}
}
