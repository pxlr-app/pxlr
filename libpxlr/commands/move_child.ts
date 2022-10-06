import { AutoId } from "../autoid.ts";
import { Command } from "./command.ts";

export class MoveChildCommand extends Command {
	public constructor(target: AutoId, public childId: AutoId, public position: number) {
		super(target);
	}
}
