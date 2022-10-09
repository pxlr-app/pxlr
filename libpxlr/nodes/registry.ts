import { Node } from "./node.ts";
import { Document } from "./document.ts";
import { Object } from "../repository/object.ts";
import { Tree } from "../repository/tree.ts";
import { AutoId } from "../autoid.ts";

export interface NodeConstructor {
	new (id: AutoId, name: string, ...args: any[]): Node;
	fromObject(object: Object, document: Document): Promise<Node>;
}

export interface TreeConstructor {
	new (id: AutoId, name: string, ...args: any[]): Node;
	fromObject(object: Object, document: Document, shallow: boolean): Promise<Node>;
}

export class Registry {
	#kindNodeMap = new Map<string, NodeConstructor>();
	#subKindTreeMap = new Map<string, TreeConstructor>();

	registerNodeConstructor(kind: string, nodeConstructor: NodeConstructor): void {
		this.#kindNodeMap.set(kind, nodeConstructor);
	}

	registerTreeConstructor(subKind: string, treeConstructor: TreeConstructor): void {
		this.#subKindTreeMap.set(subKind, treeConstructor);
	}

	getNodeConstructor(kind: string): NodeConstructor {
		if (!this.#kindNodeMap.has(kind)) {
			throw new UnregistedNodeConstructorError(kind);
		}
		return this.#kindNodeMap.get(kind)!;
	}

	getTreeConstructor(subKind: string): TreeConstructor {
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
