import { Command } from "../command.ts";
import { ReadonlyVec2 } from "@pxlr/math";
import { ID } from "../id.ts";

export class MoveCommand extends Command {
	#position: ReadonlyVec2;
	public constructor(target: ID, position: ReadonlyVec2) {
		super(target);
		this.#position = position;
	}

	get position() {
		return this.#position;
	}
}
