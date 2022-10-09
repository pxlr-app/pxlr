import { AutoId } from "../../autoid.ts";
import { Node } from "../mod.ts";
import { Command } from "./command.ts";

export class AddChildCommand extends Command {
	public constructor(target: AutoId, public childNode: Node) {
		super(target);
	}
}
