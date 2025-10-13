import { Node } from "./node.ts";
import { ID } from "./id.ts";
import { Tree } from "../repository/tree.ts";
import { Blob } from "../repository/blob.ts";

export interface NodeSerializerOptions<T extends Node> {
	node: T;
	getObjectHashByNodeId: (id: ID) => string | undefined;
}

export interface NodeDeserializerOptions {
	stream: ReadableStream<Uint8Array<ArrayBuffer>>;
	getNodeByObjectHash: (
		hash: string,
		shallow: boolean,
		abortSignal?: AbortSignal,
	) => Promise<Node>;
	shallow: boolean;
	abortSignal?: AbortSignal;
}

export type NodeDeserializer<TNode extends Node> = (options: NodeDeserializerOptions) => TNode | Promise<TNode>;
export type NodeSerializer<TNode extends Node> = (options: NodeSerializerOptions<TNode>) => Tree | Blob | Promise<Tree | Blob>;

export class NodeRegistryEntry<TNode extends Node> {
	#kind: string;
	#deserializer: NodeDeserializer<TNode>;
	#serializer: NodeSerializer<TNode>;
	constructor(kind: string, nodeDeserializer: NodeDeserializer<TNode>, nodeSerializer: NodeSerializer<TNode>) {
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

	register<TNode extends Node>(entry: NodeRegistryEntry<TNode>): void {
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
	override name = "UnregistedNodeRegistryEntryError";
	public constructor(kind: string) {
		super(`Unregisted Node kind "${kind}".`);
	}
}
