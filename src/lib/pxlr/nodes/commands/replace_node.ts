import { AutoId } from "../../autoid";
import { Node } from "../index";
import { Command } from "./command";

export class ReplaceNodeCommand extends Command {
	#node: Node;
	public constructor(hash: AutoId, node: Node) {
		super(hash, node.hash);
		this.#node = node;
	}

	get node() {
		return this.#node;
	}
}
