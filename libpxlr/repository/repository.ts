import { Filesystem, IOError } from "./filesystem/filesystem.ts";
import { Commit } from "./commit.ts";
import { Object } from "./object.ts";
import { Tree } from "./tree.ts";
import { assertReferencePath, Reference, ReferencePath } from "./reference.ts";
import { assertAutoId, AutoId } from "../autoid.ts";

export class Repository {
	#fs: Filesystem;
	constructor(
		fs: Filesystem,
	) {
		this.#fs = fs;
	}

	protected get fs() {
		return this.#fs;
	}

	async getReference(
		ref: ReferencePath,
		abortSignal?: AbortSignal,
	): Promise<Reference> {
		assertReferencePath(ref);
		try {
			const refReadableStream = await this.fs.read(ref, abortSignal);
			const reference = await Reference.deserialize(refReadableStream);
			return reference;
		} catch (error) {
			throw new IOError(error);
		}
	}

	async writeReference(
		reference: Reference,
		abortSignal?: AbortSignal,
	): Promise<void> {
		try {
			const refWritableStream = await this.fs.write(reference.ref, abortSignal);
			await reference.serialize(refWritableStream);
		} catch (error) {
			throw new IOError(error);
		}
	}

	async *listReferencePath(
		prefix: ReferencePath,
		abortSignal?: AbortSignal,
	): AsyncIterableIterator<ReferencePath> {
		assertReferencePath(prefix);
		for await (const entry of this.fs.list(prefix, abortSignal)) {
			yield `${prefix}/${entry}`;
		}
	}

	async getObject(hash: AutoId, abortSignal?: AbortSignal): Promise<Object> {
		assertAutoId(hash);
		let objectReadableStream;
		try {
			objectReadableStream = await this.fs.read(
				`objects/${hash[0]}/${hash[1]}/${hash}`,
				abortSignal,
			);
		} catch (error) {
			throw new IOError(error);
		}
		return Object.deserialize(objectReadableStream);
	}

	async writeObject(object: Object, abortSignal?: AbortSignal): Promise<void> {
		try {
			const objectWritableStream = await this.fs.write(
				`objects/${object.hash[0]}/${object.hash[1]}/${object.hash}`,
				abortSignal,
			);
			await object.serialize(objectWritableStream);
		} catch (error) {
			throw new IOError(error);
		}
	}

	async objectExists(
		hash: AutoId,
		abortSignal?: AbortSignal,
	): Promise<boolean> {
		assertAutoId(hash);
		try {
			return await this.fs.exists(
				`objects/${hash[0]}/${hash[1]}/${hash}`,
				abortSignal,
			);
		} catch (_error) {
			return false;
		}
	}

	async getCommit(hash: AutoId, abortSignal?: AbortSignal): Promise<Commit> {
		const object = await this.getObject(hash, abortSignal);
		return Commit.fromObject(object);
	}

	async writeCommit(commit: Commit, abortSignal?: AbortSignal): Promise<void> {
		return await this.writeObject(commit.toObject(), abortSignal);
	}

	async getTree(hash: AutoId, abortSignal?: AbortSignal): Promise<Tree> {
		const object = await this.getObject(hash, abortSignal);
		return Tree.fromObject(object);
	}

	async writeTree(tree: Tree, abortSignal?: AbortSignal): Promise<void> {
		return await this.writeObject(tree.toObject(), abortSignal);
	}

	async *iterTree(
		rootHash: AutoId,
		abortSignal?: AbortSignal,
	): AsyncIterableIterator<Tree> {
		const queue: AutoId[] = [rootHash];
		for (let hash = queue.shift(); hash; hash = queue.shift()) {
			if (abortSignal?.aborted === true) {
				break;
			}
			const tree = await this.getTree(hash, abortSignal);
			for (const item of tree.items) {
				if (item.kind === "tree") {
					queue.push(item.hash);
				}
			}
			yield tree;
		}
	}

	async *iterHistory(
		commitHash: AutoId,
		abortSignal?: AbortSignal,
	): AsyncIterableIterator<Commit> {
		while (commitHash) {
			if (abortSignal?.aborted === true) {
				break;
			}
			const commit = await this.getCommit(commitHash, abortSignal);
			commitHash = commit.parent;
			yield commit;
		}
	}
}
