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
			return await Reference.readFromStream(ref, readableStream);
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
			await reference.writeToStream(writableStream);
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

	private decompressStream(readableStream: ReadableStream<Uint8Array>, abortSignal?: AbortSignal) {
		const decompressStream = new DecompressionStream("gzip");
		return readableStream.pipeThrough(decompressStream, { signal: abortSignal });
	}

	private compressStream(writableStream: WritableStream<Uint8Array>, abortSignal?: AbortSignal) {
		const compressStream = new CompressionStream("gzip");
		const pipeline = compressStream.readable.pipeTo(writableStream, { signal: abortSignal });
		const writer = compressStream.writable.getWriter();
		return new WritableStream({
			write: async (chunk) => {
				await writer.write(chunk);
			},
			close: async () => {
				await writer.close();
				await pipeline;
			},
		});
	}

	async getObject(hash: AutoId, abortSignal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
		assertAutoId(hash);
		try {
			const readableStream = await this.fs.read(
				`objects/${hash[0]}/${hash[1]}/${hash}`,
				abortSignal,
			);
			return this.decompressStream(readableStream, abortSignal);
		} catch (error) {
			throw new IOError(error);
		}
	}

	async writeObject(hash: AutoId, abortSignal?: AbortSignal): Promise<WritableStream<Uint8Array>> {
		try {
			const writableStream = await this.fs.write(
				`objects/${hash[0]}/${hash[1]}/${hash}`,
				abortSignal,
			);
			return this.compressStream(writableStream, abortSignal);
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
			const decompressStream = this.decompressStream(readableStream, abortSignal);
			return await Commit.readFromStream(hash, decompressStream);
		} catch (error) {
			throw new IOError(error);
		}
	}

	async writeCommit(commit: Commit, abortSignal?: AbortSignal): Promise<void> {
		const writableStream = await this.fs.write(`objects/${commit.hash[0]}/${commit.hash[1]}/${commit.hash}`, abortSignal);
		const compressStream = this.compressStream(writableStream, abortSignal);
		await commit.writeToStream(compressStream);
	}

	async getTree<T extends Record<string, string> = Record<never, never>>(hash: AutoId, abortSignal?: AbortSignal): Promise<Tree> {
		const readableStream = await this.fs.read(`objects/${hash[0]}/${hash[1]}/${hash}`, abortSignal);
		const decompressStream = this.decompressStream(readableStream, abortSignal);
		return await Tree.readFromStream(hash, decompressStream);
	}

	async writeTree<T extends Record<string, string> = Record<never, never>>(tree: Tree, abortSignal?: AbortSignal): Promise<void> {
		const writableStream = await this.fs.write(`objects/${tree.hash[0]}/${tree.hash[1]}/${tree.hash}`, abortSignal);
		const compressStream = this.compressStream(writableStream, abortSignal);
		await tree.writeToStream(compressStream);
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
