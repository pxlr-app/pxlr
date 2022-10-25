import { assertAutoId, AutoId } from "../autoid.ts";
import { Filesystem } from "./filesystem/filesystem.ts";
import { assertReferencePath, Reference, ReferencePath } from "./reference.ts";
import { Repository } from "./repository.ts";
import { Object } from "./object.ts";

export class BufferedRepository extends Repository {
	#referenceCache: Map<ReferencePath, Reference>;
	#objectCache: Map<AutoId, Object>;
	constructor(
		fs: Filesystem,
	) {
		super(fs);
		this.#referenceCache = new Map();
		this.#objectCache = new Map();
	}

	async getReference(ref: ReferencePath, abortSignal?: AbortSignal): Promise<Reference> {
		assertReferencePath(ref);
		if (this.#referenceCache.has(ref)) {
			return this.#referenceCache.get(ref)!;
		}
		const reference = await super.getReference(ref, abortSignal);
		this.#referenceCache.set(ref, reference);
		return reference;
	}

	// deno-lint-ignore require-await
	async writeReference(reference: Reference, _abortSignal?: AbortSignal): Promise<void> {
		this.#referenceCache.set(reference.ref, reference);
	}

	async *listReferencePath(prefix: ReferencePath, abortSignal?: AbortSignal): AsyncIterableIterator<ReferencePath> {
		assertReferencePath(prefix);
		const references: ReferencePath[] = [];
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
		for await (const [ref, reference] of referenceCache) {
			abortSignal?.throwIfAborted();
			await super.writeReference(reference, abortSignal);
			this.#referenceCache.delete(ref);
		}

		const objectCache = Array.from(this.#objectCache.values());
		for await (const object of objectCache) {
			abortSignal?.throwIfAborted();
			await super.writeObject(object, abortSignal);
			this.#objectCache.delete(object.id);
		}
	}
}
