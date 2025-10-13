import { assertID, ID, id } from "./id.ts";
import { Command } from "./command.ts";
import { RenameCommand } from "./commands/rename.ts";
import { ReadonlyRect, Rect } from "@pxlr/math";

export enum NodeIter {
	Break = "break",
	Continue = "continue",
}

export abstract class Node {
	#id: ID;
	#kind: string;
	#name: string;

	public constructor(
		id: ID,
		kind: string,
		name: string,
	) {
		assertID(id);
		this.#id = id;
		this.#kind = kind;
		this.#name = name;
	}

	get id() {
		return this.#id;
	}

	get kind() {
		return this.#kind;
	}

	get name() {
		return this.#name;
	}

	*iter(): Iterator<Node> {}

	[Symbol.iterator](): Iterator<Node> {
		return this.iter();
	}

	abstract execCommand(_command: Command): Node;

	rename(renameTo: string): RenameCommand {
		return new RenameCommand(this.id, renameTo);
	}
}

export class UnloadedNode extends Node {
	public constructor(
		id: ID,
		kind: string,
		name: string,
	) {
		super(id, kind, name);
	}

	override execCommand(_command: Command): Node {
		throw new UnloadedNodeMethodError();
	}
}

export class UnloadedNodeMethodError extends Error {
	override name = "UnloadedNodeMethodError";
}

export class NodeNotFoundError extends Error {
	override name = "NodeNotFoundError";
	public constructor(hash: string) {
		super(`Could not find node ${hash}.`);
	}
}
