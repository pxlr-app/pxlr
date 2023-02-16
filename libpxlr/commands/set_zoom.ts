import { AutoId } from "../autoid.ts";
import { Command } from "./command.ts";

export class SetZoomCommand extends Command {
	#newZoom: number;
	public constructor(hash: AutoId, target: AutoId, newZoom: number) {
		super(hash, target);
		this.#newZoom = newZoom;
	}

	get newZoom() {
		return this.#newZoom;
	}
}
