import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { Command } from "../commands/command.ts";
import { RenameCommand } from "../commands/rename.ts";
import { NodeDeserializerOptions } from "./registry.ts";

export enum NodeIter {
	Break = "break",
	Continue = "continue",
}

export abstract class Node {
	#hash: AutoId;
	#id: AutoId;
	#kind: string;
	#name: string;

	public constructor(
		hash: AutoId,
		id: AutoId,
		kind: string,
		name: string,
	) {
		assertAutoId(hash);
		assertAutoId(id);
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

	dispatch(_command: Command): Node {
		return this;
	}

	rename(renameTo: string): RenameCommand {
		return new RenameCommand(autoid(), this.hash, renameTo);
	}
}

export class UnloadedNode extends Node {
	public constructor(
		hash: string,
		id: string,
		kind: string,
		name: string,
	) {
		super(hash, id, kind, name);
	}

	static new(kind: string, name: string) {
		return new UnloadedNode(autoid(), autoid(), kind, name);
	}

	dispatch(_command: Command): Node {
		throw new UnloadedNodeMethodError();
	}
}

export class UnloadedNodeMethodError extends Error {
	public name = "UnloadedNodeMethodError";
}

export class NodeNotFoundError extends Error {
	public name = "NodeNotFoundError";
	public constructor(hash: string) {
		super(`Could not find node ${hash}.`);
	}
}
