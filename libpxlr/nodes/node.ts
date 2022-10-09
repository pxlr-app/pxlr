import { assertAutoId, AutoId } from "../autoid.ts";
import { Command } from "./commands/mod.ts";
import { Object } from "../repository/object.ts";

export abstract class Node {
	public constructor(
		public readonly id: AutoId,
		public readonly kind: string,
		public readonly name: string,
	) {
		assertAutoId(id);
	}

	*iter(): IterableIterator<Node> {
		yield this;
	}
	[Symbol.iterator](): Iterator<Node> {
		return this.iter();
	}
	abstract executeCommand(command: Command): Node;
	abstract toObject(): Object;
}
