import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { Object } from "../repository/object.ts";
import { Command, RenameCommand } from "./commands/mod.ts";
import { NodeConstructorOptions } from "./registry.ts";

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

	abstract executeCommand(command: Command): Node;

	abstract toObject(): Object;

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

	executeCommand(_command: Command): Node {
		throw new UnloadedNodeMethodError();
	}

	toObject(): Object {
		throw new UnloadedNodeMethodError();
	}

	// deno-lint-ignore require-await
	static async fromObject({ object }: NodeConstructorOptions): Promise<Node> {
		return new UnloadedNode(object.hash, object.id, object.kind, object.headers.get("name") ?? "(unnamed)");
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
