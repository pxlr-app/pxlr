import { Node } from "../mod.ts";
import { Command } from "./command.ts";

export class ReplaceNodeCommand extends Command {
	public constructor(public node: Node) {
		super(node.hash);
	}
}
