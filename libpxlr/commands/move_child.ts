import { AutoId } from "../autoid.ts";
import { Command } from "./command.ts";

export class MoveChildCommand extends Command {
	public constructor(target: AutoId, public readonly childId: AutoId, public readonly position: number) {
		super(target);
	}
}
