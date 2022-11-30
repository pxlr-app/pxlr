import { AutoId } from "../../autoid";
import { Node } from "../index";
import { Command } from "./command";

export class AddChildCommand extends Command {
	#childNode: Node;
	public constructor(hash: AutoId, target: AutoId, childNode: Node) {
		super(hash, target);
		this.#childNode = childNode;
	}

	get childNode() {
		return this.#childNode;
	}
}
