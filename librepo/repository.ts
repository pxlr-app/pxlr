import { Filesystem, IOError } from "./filesystem/filesystem.ts";
import { Commit } from "./commit.ts";
import { Tree } from "./tree.ts";
import { assertReferencePath, Reference, ReferencePath } from "./reference.ts";
import { assertAutoId, AutoId } from "../libpxlr/autoid.ts";

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
			const readableStream = await this.fs.read(ref, abortSignal);
			return await Reference.fromStream(ref, readableStream);
		} catch (error) {
			throw new IOError(error);
		}
	}

	async writeReference(
		reference: Reference,
		abortSignal?: AbortSignal,
	): Promise<void> {
		try {
			const writableStream = await this.fs.write(reference.ref, abortSignal);
			await reference.toStream().pipeTo(writableStream);
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

	async getObject(hash: AutoId, abortSignal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
		assertAutoId(hash);
		try {
			const readableStream = await this.fs.read(
				`objects/${hash[0]}/${hash[1]}/${hash}`,
				abortSignal,
			);
			return readableStream.pipeThrough(new DecompressionStream("gzip"), { signal: abortSignal });
		} catch (error) {
			throw new IOError(error);
		}
	}

	async writeObject(hash: AutoId, stream: ReadableStream<Uint8Array>, abortSignal?: AbortSignal): Promise<void> {
		try {
			const writableStream = await this.fs.write(
				`objects/${hash[0]}/${hash[1]}/${hash}`,
				abortSignal,
			);
			await stream.pipeThrough(new CompressionStream("gzip")).pipeTo(writableStream);
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
		try {
			const readableStream = await this.fs.read(`objects/${hash[0]}/${hash[1]}/${hash}`, abortSignal);
			const decompressStream = readableStream.pipeThrough(new DecompressionStream("gzip"), { signal: abortSignal });
			return await Commit.fromStream(hash, decompressStream);
		} catch (error) {
			throw new IOError(error);
		}
	}

	async writeCommit(commit: Commit, abortSignal?: AbortSignal): Promise<void> {
		const writableStream = await this.fs.write(`objects/${commit.hash[0]}/${commit.hash[1]}/${commit.hash}`, abortSignal);
		const compressStream = new CompressionStream("gzip");
		await commit.toStream().pipeThrough(compressStream).pipeTo(writableStream);
	}

	async getTree<T extends Record<string, string> = Record<never, never>>(hash: AutoId, abortSignal?: AbortSignal): Promise<Tree> {
		const readableStream = await this.fs.read(`objects/${hash[0]}/${hash[1]}/${hash}`, abortSignal);
		const decompressStream = new DecompressionStream("gzip");
		return await Tree.fromStream(hash, readableStream.pipeThrough(decompressStream));
	}

	async writeTree<T extends Record<string, string> = Record<never, never>>(tree: Tree, abortSignal?: AbortSignal): Promise<void> {
		const writableStream = await this.fs.write(`objects/${tree.hash[0]}/${tree.hash[1]}/${tree.hash}`, abortSignal);
		const compressStream = new CompressionStream("gzip");
		await tree.toStream().pipeThrough(compressStream).pipeTo(writableStream);
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
