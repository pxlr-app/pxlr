import { AutoId, isAutoid } from "../autoid.ts";
import { Command } from "../commands/mod.ts";
import { Object } from "../objects/object.ts";

export abstract class Node<O extends Object> {
	public constructor(
		public readonly id: AutoId,
		public readonly kind: string,
		public readonly name: string,
	) {
		if (!isAutoid(id)) {
			throw new TypeError(`Parameter "id" does not appear to be an AutoId.`);
		}
	}

	*iter(): IterableIterator<Node<any>> {
		yield this;
	}
	[Symbol.iterator](): Iterator<Node<any>> {
		return this.iter();
	}
	abstract executeCommand(command: Command): Node<O>;
	abstract toObject(): O;
}
