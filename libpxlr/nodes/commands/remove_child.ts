import { AutoId } from "../../autoid.ts";
import { Command } from "./command.ts";

export class RemoveChildCommand extends Command {
	public constructor(target: AutoId, public readonly childId: AutoId) {
		super(target);
	}
}
