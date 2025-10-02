import { File, Folder } from "@pxlr/vfs";
import { Blob } from "./blob.ts";
import { Commit } from "./commit.ts";
import { Tree } from "./tree.ts";
import { Reference } from "./reference.ts";
import { join } from "@std/path/join";

export class Repository {
	#root: Folder;

	constructor(fs: Folder) {
		this.#root = fs;
	}

	async getHead(abortSignal?: AbortSignal): Promise<Reference> {
		return this.getReference("HEAD", abortSignal);
	}

	async setHead(ref: string, abortSignal?: AbortSignal): Promise<void> {
		return this.setReference("HEAD", new Reference(ref), abortSignal);
	}

	async setBlob(blob: Blob, abortSignal?: AbortSignal): Promise<void> {
		const file = await this.#root.getFile(`objects/${blob.hash.slice(0, 2)}/${blob.hash.slice(2)}`, abortSignal);
		await blob.toReadableStream().pipeTo(await file.write(0, abortSignal));
	}

	async getBlob(hash: string, abortSignal?: AbortSignal): Promise<Blob> {
		const file = await this.#root.getFile(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		const blob = await Blob.fromReadableStream(await file.read(1024 * 1024 * 1024, 0, abortSignal));
		return blob;
	}

	async setCommit(commit: Commit, abortSignal?: AbortSignal): Promise<void> {
		const file = await this.#root.getFile(`objects/${commit.hash.slice(0, 2)}/${commit.hash.slice(2)}`, abortSignal);
		await commit.toReadableStream().pipeTo(await file.write(0, abortSignal));
	}

	async getCommit(hash: string, abortSignal?: AbortSignal): Promise<Commit> {
		const file = await this.#root.getFile(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		const commit = await Commit.fromReadableStream(await file.read(1024 * 1024 * 1024, 0, abortSignal));
		return commit;
	}

	async setReference(path: string, ref: Reference, abortSignal?: AbortSignal): Promise<void> {
		const file = await this.#root.getFile(path, abortSignal);
		await ref.toReadableStream().pipeTo(await file.write(0, abortSignal));
	}

	async getReference(path: string, abortSignal?: AbortSignal): Promise<Reference> {
		const file = await this.#root.getFile(path, abortSignal);
		const ref = await Reference.fromReadableStream(await file.read(1024 * 1024 * 1024, 0, abortSignal));
		return ref;
	}

	async setTree(tree: Tree, abortSignal?: AbortSignal): Promise<void> {
		const file = await this.#root.getFile(`objects/${tree.hash.slice(0, 2)}/${tree.hash.slice(2)}`, abortSignal);
		await tree.toReadableStream().pipeTo(await file.write(0, abortSignal));
	}

	async getTree(hash: string, abortSignal?: AbortSignal): Promise<Tree> {
		const file = await this.#root.getFile(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		const tree = await Tree.fromReadableStream(await file.read(1024 * 1024 * 1024, 0, abortSignal));
		return tree;
	}

	async *iterTree(tree: string, abortSignal?: AbortSignal): AsyncIterableIterator<[hash: string, Tree]> {
		const queue: string[] = [tree];
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
			yield [hash, tree] as const;
		}
	}

	async *iterCommitChain(commit: string, abortSignal?: AbortSignal): AsyncIterableIterator<[hash: string, Commit]> {
		const queue: string[] = [commit];
		for (let hash = queue.shift(); hash; hash = queue.shift()) {
			if (abortSignal?.aborted === true) {
				break;
			}
			const commit = await this.getCommit(hash, abortSignal);
			yield [hash, commit] as const;
			if (!commit.parent) {
				break;
			}
			queue.push(commit.parent);
		}
	}

	async *iterReference(path: string, abortSignal?: AbortSignal): AsyncIterableIterator<[path: string, Reference]> {
		const dir = await this.#root.getDir(path, abortSignal);
		for await (const entry of dir.list(abortSignal)) {
			if (entry instanceof File) {
				const reference = await Reference.fromReadableStream(await entry.read(1024 * 1024 * 1024, 0, abortSignal));
				yield [join(path, entry.base), reference] as const;
			}
		}
	}
}
