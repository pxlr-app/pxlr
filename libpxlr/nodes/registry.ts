import { Node } from "./node.ts";
import { AutoId } from "../autoid.ts";

export interface NodeDeserializerOptions {
	item: {
		hash: AutoId;
		id: AutoId;
		kind: string;
		name: string;
	};
	stream: ReadableStream<Uint8Array>;
	getNodeByHash: (
		hash: AutoId,
		shallow: boolean,
		abortSignal?: AbortSignal,
	) => Promise<Node>;
	shallow: boolean;
	abortSignal?: AbortSignal;
}

export type NodeDeserializer<T extends Node> = (
	options: NodeDeserializerOptions,
) => T | Promise<T>;

export type NodeSerializer<T extends Node> = (node: T, writableStream: WritableStream<Uint8Array>) => void | Promise<void>;

export class NodeRegistryEntry<T extends Node> {
	#kind: string;
	#deserializer: NodeDeserializer<T>;
	#serializer: NodeSerializer<T>;
	constructor(kind: string, nodeDeserializer: NodeDeserializer<T>, nodeSerializer: NodeSerializer<T>) {
		this.#kind = kind;
		this.#deserializer = nodeDeserializer;
		this.#serializer = nodeSerializer;
	}

	get kind() {
		return this.#kind;
	}

	get deserialize() {
		return this.#deserializer;
	}

	get serialize() {
		return this.#serializer;
	}
}

export class NodeRegistry {
	#entryMap = new Map<string, NodeRegistryEntry<Node>>();

	register<T extends Node>(entry: NodeRegistryEntry<T>): void {
		// deno-lint-ignore no-explicit-any
		this.#entryMap.set(entry.kind, entry as any);
	}

	get(kind: string): NodeRegistryEntry<Node> {
		if (!this.#entryMap.has(kind)) {
			throw new UnregistedNodeRegistryEntryError(kind);
		}
		return this.#entryMap.get(kind)!;
	}
}

export class UnregistedNodeRegistryEntryError extends Error {
	public name = "UnregistedNodeRegistryEntryError";
	public constructor(kind: string) {
		super(`Unregisted Node kind "${kind}".`);
	}
}
