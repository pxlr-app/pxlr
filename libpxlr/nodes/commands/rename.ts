import { AutoId } from "../../autoid.ts";
import { Command } from "./command.ts";

export class RenameCommand extends Command {
	public constructor(targetHash: AutoId, public renameTo: string) {
		super(targetHash);
	}
}
