import { AutoId } from "../../autoid.ts";
import { Node } from "../mod.ts";
import { Command } from "./command.ts";

export class ReplaceNodeCommand extends Command {
	public constructor(target: AutoId, public node: Node) {
		super(target);
	}
}
