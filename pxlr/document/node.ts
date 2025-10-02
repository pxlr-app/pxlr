import { assertID, ID, id } from "./id.ts";
import { Command } from "./command.ts";
import { RenameCommand } from "./commands/rename.ts";

export enum NodeIter {
	Break = "break",
	Continue = "continue",
}

export abstract class Node {
	#hash: string;
	#id: ID;
	#kind: string;
	#name: string;

	public constructor(
		hash: string,
		id: ID,
		kind: string,
		name: string,
	) {
		assertID(id);
		this.#hash = hash;
		this.#id = id;
		this.#kind = kind;
		this.#name = name;
	}

	get hash() {
		return this.#hash;
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

	equals(other: unknown): boolean {
		return !!other && other instanceof Node && other.hash === this.hash;
	}

	*iter(): Iterator<Node> {
	}

	[Symbol.iterator](): Iterator<Node> {
		return this.iter();
	}

	abstract dispatch(_command: Command): Node;

	rename(renameTo: string): RenameCommand {
		return new RenameCommand(id(), this.hash, renameTo);
	}
}

export class UnloadedNode extends Node {
	public constructor(
		hash: string,
		id: ID,
		kind: string,
		name: string,
	) {
		super(hash, id, kind, name);
	}

	static new(kind: string, name: string) {
		return new UnloadedNode(id(), id(), kind, name);
	}

	override dispatch(_command: Command): Node {
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
