import { AutoId } from "../autoid.ts";
import { Command } from "./command.ts";

export class SetCenterCommand extends Command {
	#newCenter: readonly [number, number];
	public constructor(hash: AutoId, target: AutoId, newCenter: readonly [number, number]) {
		super(hash, target);
		this.#newCenter = newCenter;
	}

	get newCenter() {
		return this.#newCenter;
	}
}
