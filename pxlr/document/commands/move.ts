import { Command } from "../command.ts";
import { ReadonlyVec2 } from "@pxlr/math";

export class MoveCommand extends Command {
	#position: ReadonlyVec2;
	public constructor(hash: string, target: string, position: ReadonlyVec2) {
		super(hash, target);
		this.#position = position;
	}

	get position() {
		return this.#position;
	}
}
