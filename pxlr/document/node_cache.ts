import { Node } from "./node.ts";

export class NodeCache {
	#map: Map<string, WeakRef<Node>>;

	constructor(entries?: readonly (readonly [string, WeakRef<Node>])[] | null) {
		this.#map = new Map(entries);
	}

	size(): number {
		return this.#map.size;
	}

	delete(key: string): boolean {
		return this.#map.delete(key);
	}

	has(key: string): boolean {
		return this.#map.has(key);
	}

	get(key: string): Node | undefined {
		const value = this.#map.get(key);
		return value?.deref();
	}

	set(key: string, value: Node): this {
		this.#map.set(key, new WeakRef(value));
		return this;
	}

	*entries(): IterableIterator<[string, Node | undefined]> {
		for (const [key, ref] of this.#map.entries()) {
			yield [key, ref.deref()];
		}
	}

	[Symbol.iterator](): IterableIterator<[string, Node | undefined]> {
		return this.entries();
	}

	clearUnusedCache() {
		for (const [id, nodeRef] of this.#map.entries()) {
			if (!nodeRef.deref()) {
				this.delete(id);
			}
		}
	}
}
