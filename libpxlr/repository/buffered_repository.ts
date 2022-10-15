import { assertAutoId, AutoId } from "../autoid.ts";
import { Filesystem } from "./filesystem/filesystem.ts";
import { assertReference, Reference } from "./reference.ts";
import { Repository } from "./repository.ts";
import { Object } from "./object.ts";

export class BufferedRepository extends Repository {
	#referenceCache: Map<Reference, AutoId>;
	#objectCache: Map<AutoId, Object>;
	constructor(
		fs: Filesystem,
	) {
		super(fs);
		this.#referenceCache = new Map();
		this.#objectCache = new Map();
	}

	async getReference(reference: Reference, abortSignal?: AbortSignal): Promise<AutoId> {
		assertReference(reference);
		if (this.#referenceCache.has(reference)) {
			return this.#referenceCache.get(reference)!;
		}
		const id = await super.getReference(reference, abortSignal);
		this.#referenceCache.set(reference, id);
		return id;
	}

	// deno-lint-ignore require-await
	async writeReference(reference: Reference, commitId: AutoId, _abortSignal?: AbortSignal): Promise<void> {
		assertReference(reference);
		assertAutoId(commitId);
		this.#referenceCache.set(reference, commitId);
	}

	async *listReference(prefix: Reference, abortSignal?: AbortSignal): AsyncIterableIterator<Reference> {
		assertReference(prefix);
		const references: Reference[] = [];
		for await (const entry of this.fs.list(`/${prefix}`, abortSignal)) {
			references.push(`${prefix}/${entry}`);
		}
		references.push(...this.#referenceCache.keys());
		references.sort();

		yield* new Set(references);
	}

	async getObject(id: AutoId, abortSignal?: AbortSignal): Promise<Object> {
		assertAutoId(id);
		if (this.#objectCache.has(id)) {
			return this.#objectCache.get(id)!;
		}
		const object = await super.getObject(id, abortSignal);
		this.#objectCache.set(id, object);
		return object;
	}

	// deno-lint-ignore require-await
	async writeObject(object: Object, _abortSignal?: AbortSignal): Promise<void> {
		this.#objectCache.set(object.id, object);
	}

	async objectExists(id: AutoId, abortSignal?: AbortSignal): Promise<boolean> {
		assertAutoId(id);
		if (this.#objectCache.has(id)) {
			return true;
		}
		return await super.objectExists(id, abortSignal);
	}

	async flushToFilesystem(abortSignal?: AbortSignal): Promise<void> {
		const referenceCache = Array.from(this.#referenceCache.entries());
		for await (const [reference, commitId] of referenceCache) {
			abortSignal?.throwIfAborted();
			await super.writeReference(reference, commitId, abortSignal);
			this.#referenceCache.delete(reference);
		}

		const objectCache = Array.from(this.#objectCache.values());
		for await (const object of objectCache) {
			abortSignal?.throwIfAborted();
			await super.writeObject(object, abortSignal);
			this.#objectCache.delete(object.id);
		}
	}
}
