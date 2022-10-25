import { AutoId } from "../../autoid.ts";
import { Command } from "./command.ts";

export class SetContentCommand extends Command {
	public constructor(targetHash: AutoId, public newContent: string) {
		super(targetHash);
	}
}
