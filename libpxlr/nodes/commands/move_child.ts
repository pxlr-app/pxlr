import { assertAutoId, AutoId } from "../../autoid.ts";
import { Command } from "./command.ts";

export class MoveChildCommand extends Command {
	public constructor(targetHash: AutoId, public childHash: AutoId, public position: number) {
		super(targetHash);
		assertAutoId(childHash);
	}
}
