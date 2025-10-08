import { Command } from "../command.ts";
import { ID } from "../id.ts";

export class MoveChildCommand extends Command {
	#child: ID;
	#position: number;
	public constructor(
		target: ID,
		child: ID,
		position: number,
	) {
		super(target);
		this.#child = child;
		this.#position = position;
	}

	get child() {
		return this.#child;
	}

	get position() {
		return this.#position;
	}
}
