import { AutoId } from "../autoid.ts";
import { Command } from "./command.ts";

export class SetContentCommand extends Command {
	public constructor(target: AutoId, public setContent: string) {
		super(target);
	}
}