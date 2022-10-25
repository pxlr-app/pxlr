import { assertAutoId, AutoId, autoid } from "../autoid.ts";
import { Object } from "../repository/object.ts";
import { Command, RenameCommand, ReplaceNodeCommand } from "./commands/mod.ts";
import { Workspace } from "../workspace.ts";
import { NodeConstructorOptions } from "./registry.ts";

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

	*iter(): IterableIterator<Node> {
		yield this;
	}
	[Symbol.iterator](): Iterator<Node> {
		return this.iter();
	}
	abstract executeCommand(command: Command): Node;
	abstract toObject(): Object;

	rename(renameTo: string): RenameCommand {
		return new RenameCommand(this.hash, renameTo);
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

	executeCommand(command: Command): Node {
		if (command.targetHash === this.hash) {
			if (command instanceof RenameCommand) {
				return new UnloadedNode(autoid(), this.id, this.kind, command.renameTo);
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
		return new UnloadedNode(object.id, object.headers.get("id") ?? "", object.kind, object.headers.get("name") ?? "_");
	}

	async load(workspace: Workspace): Promise<ReplaceNodeCommand> {
		const node = await workspace.getNodeById(this.id);
		return new ReplaceNodeCommand(node);
	}
}

export class UnloadedNodeMethodError extends Error {
	public name = "UnloadedNodeMethodError";
}

export class NodeNotFoundError extends Error {
	public name = "NodeNotFoundError";
	public constructor(id: string) {
		super(`Could not find node ${id}.`);
	}
}
