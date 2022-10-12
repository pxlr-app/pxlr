import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { Object } from "../repository/object.ts";
import { Command, RenameCommand, ReplaceNodeCommand } from "./commands/mod.ts";
import { Document } from "./document.ts";
import { NodeConstructorOptions } from "./registry.ts";

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

	rename(renameTo: string): RenameCommand {
		return new RenameCommand(this.id, renameTo);
	}
}

export class UnloadedNode extends Node {
	public constructor(
		id: string,
		kind: string,
		name: string,
	) {
		super(id, kind, name);
	}

	static new(kind: string, name: string) {
		return new UnloadedNode(autoid(), kind, name);
	}

	executeCommand(command: Command): Node {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				return new UnloadedNode(autoid(), this.kind, command.renameTo);
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
			throw new UnloadedNodeMethodError();
		}
		return this;
	}

	toObject(): Object {
		throw new UnloadedNodeMethodError();
	}

	// deno-lint-ignore require-await
	static async fromObject({ object }: NodeConstructorOptions): Promise<Node> {
		return new UnloadedNode(object.id, object.kind, object.headers.get("name") ?? "_");
	}

	async load(document: Document): Promise<ReplaceNodeCommand> {
		const node = await document.loadNodeById(this.id);
		return new ReplaceNodeCommand(node);
	}
}

export class UnloadedNodeMethodError extends Error {
	public name = "UnloadedNodeMethodError";
}
