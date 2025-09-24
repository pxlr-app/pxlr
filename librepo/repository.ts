import { Filesystem, IOError } from "@pxlr/vfs";
import { Commit } from "./commit.ts";
import { Tree } from "./tree.ts";
import { assertReferencePath, Reference, ReferencePath } from "./reference.ts";
import { assertID, ID } from "./id.ts";
import { assert } from "@std/assert/assert";

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
		} catch (_cause) {
			throw new IOError();
		}
	}

	async writeReference(
		reference: Reference,
		abortSignal?: AbortSignal,
	): Promise<void> {
		try {
			const writableStream = await this.fs.write(reference.ref, abortSignal);
			await reference.toStream().pipeTo(writableStream);
		} catch (_cause) {
			throw new IOError();
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

	async getObject(hash: ID, abortSignal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
		assertID(hash);
		try {
			const readableStream = await this.fs.read(
				`objects/${hash[0]}/${hash[1]}/${hash}`,
				abortSignal,
			);
			return readableStream.pipeThrough(new DecompressionStream("gzip") as any, { signal: abortSignal });
		} catch (_cause) {
			throw new IOError();
		}
	}

	async writeObject(hash: ID, stream: ReadableStream<Uint8Array>, abortSignal?: AbortSignal): Promise<void> {
		assertID(hash);
		try {
			const writableStream = await this.fs.write(
				`objects/${hash[0]}/${hash[1]}/${hash}`,
				abortSignal,
			);
			await stream.pipeThrough(new CompressionStream("gzip") as any).pipeTo(writableStream);
		} catch (_cause) {
			throw new IOError();
		}
	}

	async objectExists(
		hash: ID,
		abortSignal?: AbortSignal,
	): Promise<boolean> {
		assertID(hash);
		try {
			return await this.fs.exists(
				`objects/${hash[0]}/${hash[1]}/${hash}`,
				abortSignal,
			);
		} catch (_error) {
			return false;
		}
	}

	async getCommit(hash: ID, abortSignal?: AbortSignal): Promise<Commit> {
		assertID(hash);
		try {
			const readableStream = await this.fs.read(`objects/${hash[0]}/${hash[1]}/${hash}`, abortSignal);
			const decompressStream = readableStream.pipeThrough(new DecompressionStream("gzip") as any, { signal: abortSignal });
			return await Commit.fromStream(hash, decompressStream as any);
		} catch (_cause) {
			throw new IOError();
		}
	}

	async writeCommit(commit: Commit, abortSignal?: AbortSignal): Promise<void> {
		const writableStream = await this.fs.write(`objects/${commit.hash[0]}/${commit.hash[1]}/${commit.hash}`, abortSignal);
		const compressStream = new CompressionStream("gzip");
		await commit.toStream().pipeThrough(compressStream as any).pipeTo(writableStream);
	}

	async getTree(hash: ID, abortSignal?: AbortSignal): Promise<Tree> {
		assertID(hash);
		const readableStream = await this.fs.read(`objects/${hash[0]}/${hash[1]}/${hash}`, abortSignal);
		const decompressStream = new DecompressionStream("gzip");
		return await Tree.fromStream(hash, readableStream.pipeThrough(decompressStream as any));
	}

	async writeTree(tree: Tree, abortSignal?: AbortSignal): Promise<void> {
		const writableStream = await this.fs.write(`objects/${tree.hash[0]}/${tree.hash[1]}/${tree.hash}`, abortSignal);
		const compressStream = new CompressionStream("gzip");
		await tree.toStream().pipeThrough(compressStream as any).pipeTo(writableStream);
	}

	async *iterTree(
		rootHash: ID,
		abortSignal?: AbortSignal,
	): AsyncIterableIterator<Tree> {
		assertID(rootHash);
		const queue: ID[] = [rootHash];
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
		commitHash: ID,
		abortSignal?: AbortSignal,
	): AsyncIterableIterator<Commit> {
		assertID(commitHash);
		while (commitHash) {
			if (abortSignal?.aborted === true) {
				break;
			}
			const commit = await this.getCommit(commitHash, abortSignal);
			if (!commit.parent) {
				break;
			}
			commitHash = commit.parent;
			yield commit;
		}
	}
}
