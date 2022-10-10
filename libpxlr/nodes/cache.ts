import { assertAutoId, AutoId } from "../autoid.ts";
import { Node } from "./node.ts";

export class NodeCache {
	#cache = new Map<AutoId, WeakRef<Node>>();

	set(id: AutoId, node: Node) {
		assertAutoId(id);
		this.#cache.set(id, new WeakRef(node));
	}

	get(id: AutoId): Node | undefined {
		assertAutoId(id);
		const nodeRef = this.#cache.get(id);
		if (nodeRef) {
			const node = nodeRef.deref();
			if (node) {
				return node;
			}
			this.#cache.delete(id);
		}
	}

	clearAll() {
		this.#cache.clear();
	}

	clearReclaimed() {
		const notReclaimed = Array.from(this.#cache.entries()).filter(([_id, nodeRef]) => !!nodeRef.deref());
		this.#cache = new Map(notReclaimed);
	}
}
