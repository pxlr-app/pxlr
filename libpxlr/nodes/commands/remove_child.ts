import { AutoId } from "../../autoid.ts";
import { Command } from "./command.ts";

export class RemoveChildCommand extends Command {
	public constructor(targetHash: AutoId, public childHash: AutoId) {
		super(targetHash);
	}
}
