import { Command } from "../command.ts";
import { assertID, ID } from "../id.ts";

export class RemoveChildCommand extends Command {
	#child: ID;
	public constructor(target: ID, child: ID) {
		super(target);
		assertID(child);
		this.#child = child;
	}

	get child() {
		return this.#child;
	}
}
