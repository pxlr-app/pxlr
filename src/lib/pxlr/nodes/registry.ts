import { Node } from "./node";
import { Object } from "../repository/object";
import { AutoId } from "../autoid";

export interface NodeConstructorOptions {
	object: Object;
	getNodeByHash: (
		hash: AutoId,
		shallow: boolean,
		abortSignal?: AbortSignal,
	) => Promise<Node>;
	shallow: boolean;
	abortSignal?: AbortSignal;
}

export type NodeDeserializer = (
	options: NodeConstructorOptions,
) => Promise<Node>;

export class NodeRegistryEntry {
	#kind: string;
	#deserializer: NodeDeserializer;
	constructor(kind: string, nodeConstructor: NodeDeserializer) {
		this.#kind = kind;
		this.#deserializer = nodeConstructor;
	}

	get kind() {
		return this.#kind;
	}

	get deserializer() {
		return this.#deserializer;
	}
}

export class NodeRegistry {
	#entryMap = new Map<string, NodeRegistryEntry>();
	#entryTreeMap = new Map<string, NodeRegistryEntry>();

	registerNodeConstructor(entry: NodeRegistryEntry): void {
		this.#entryMap.set(entry.kind, entry);
	}

	registerTreeConstructor(entry: NodeRegistryEntry): void {
		this.#entryTreeMap.set(entry.kind, entry);
	}

	getNodeConstructor(kind: string): NodeDeserializer {
		if (!this.#entryMap.has(kind)) {
			throw new UnregistedNodeConstructorError(kind);
		}
		return this.#entryMap.get(kind)!.deserializer;
	}

	getTreeConstructor(subKind: string): NodeDeserializer {
		if (!this.#entryTreeMap.has(subKind)) {
			throw new UnregistedTreeConstructorError(subKind);
		}
		return this.#entryTreeMap.get(subKind)!.deserializer;
	}
}

export class UnregistedNodeConstructorError extends Error {
	public name = "UnregistedNodeConstructorError";
	public constructor(kind: string) {
		super(`Unregisted Node constructor "${kind}".`);
	}
}

export class UnregistedTreeConstructorError extends Error {
	public name = "UnregistedTreeConstructorError";
	public constructor(kind: string) {
		super(`Unregisted Tree constructor "${kind}".`);
	}
}
