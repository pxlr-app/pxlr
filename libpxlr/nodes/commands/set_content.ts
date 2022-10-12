import { AutoId } from "../../autoid.ts";
import { Command } from "./command.ts";

export class SetContentCommand extends Command {
	public constructor(target: AutoId, public readonly newContent: string) {
		super(target);
	}
}
