import { Node } from "./node.ts";
import { Document } from "./document.ts";
import { Object } from "../repository/object.ts";

export interface NodeConstructorOptions {
	object: Object;
	document: Document;
	shallow: boolean
}

export interface NodeConstructor {
	fromObject(options: NodeConstructorOptions): Promise<Node>;
}

export class Registry {
	#kindNodeMap = new Map<string, NodeConstructor>();
	#subKindTreeMap = new Map<string, NodeConstructor>();

	registerNodeConstructor(kind: string, nodeConstructor: NodeConstructor): void {
		this.#kindNodeMap.set(kind, nodeConstructor);
	}

	registerTreeConstructor(subKind: string, treeConstructor: NodeConstructor): void {
		this.#subKindTreeMap.set(subKind, treeConstructor);
	}

	getNodeConstructor(kind: string): NodeConstructor {
		if (!this.#kindNodeMap.has(kind)) {
			throw new UnregistedNodeConstructorError(kind);
		}
		return this.#kindNodeMap.get(kind)!;
	}

	getTreeConstructor(subKind: string): NodeConstructor {
		if (!this.#subKindTreeMap.has(subKind)) {
			throw new UnregistedTreeConstructorError(subKind);
		}
		return this.#subKindTreeMap.get(subKind)!;
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
