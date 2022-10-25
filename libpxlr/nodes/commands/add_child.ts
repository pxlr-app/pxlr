import { AutoId } from "../../autoid.ts";
import { Node } from "../mod.ts";
import { Command } from "./command.ts";

export class AddChildCommand extends Command {
	public constructor(targetHash: AutoId, public childNode: Node) {
		super(targetHash);
	}
}
