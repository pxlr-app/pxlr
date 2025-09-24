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

	async #computeHash(data: Uint8Array<ArrayBuffer>): Promise<string> {
		const hashBuffer = await crypto.subtle.digest("SHA-1", data);
		const hash = Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return hash;
	}

	async setBlob(blob: Blob, abortSignal?: AbortSignal): Promise<string> {
		const buffer = new Uint8Array(blob.toArrayBuffer());
		const hash = await this.#computeHash(buffer);
		const file = await this.#root.open(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		await file.write(buffer, 0, abortSignal);
		return hash;
	}

	async getBlob(hash: string, abortSignal?: AbortSignal): Promise<Blob> {
		const file = await this.#root.open(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		const buffer = await file.arrayBuffer(abortSignal);
		const blob = await Blob.fromArrayBuffer(buffer);
		return blob;
	}

	async setCommit(commit: Commit, abortSignal?: AbortSignal): Promise<string> {
		const buffer = new Uint8Array(commit.toArrayBuffer());
		const hash = await this.#computeHash(buffer);
		const file = await this.#root.open(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		await file.write(buffer, 0, abortSignal);
		return hash;
	}

	async getCommit(hash: string, abortSignal?: AbortSignal): Promise<Commit> {
		const file = await this.#root.open(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		const buffer = await file.arrayBuffer(abortSignal);
		const commit = await Commit.fromArrayBuffer(buffer);
		return commit;
	}

	async setReference(path: string, ref: Reference, abortSignal?: AbortSignal): Promise<void> {
		const file = await this.#root.open(path, abortSignal);
		await file.write(new Uint8Array(ref.toArrayBuffer()), 0, abortSignal);
	}

	async getReference(path: string, abortSignal?: AbortSignal): Promise<Reference> {
		const file = await this.#root.open(path, abortSignal);
		const buffer = await file.arrayBuffer(abortSignal);
		const reference = await Reference.fromArrayBuffer(buffer);
		return reference;
	}

	async setTree(tree: Tree, abortSignal?: AbortSignal): Promise<string> {
		const buffer = new Uint8Array(tree.toArrayBuffer());
		const hash = await this.#computeHash(buffer);
		const file = await this.#root.open(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		await file.write(buffer, 0, abortSignal);
		return hash;
	}

	async getTree(hash: string, abortSignal?: AbortSignal): Promise<Tree> {
		const file = await this.#root.open(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		const buffer = await file.arrayBuffer(abortSignal);
		const tree = await Tree.fromArrayBuffer(buffer);
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
		const dir = await this.#root.openDir(path, abortSignal);
		for await (const entry of dir.list(abortSignal)) {
			if (entry instanceof File) {
				const buffer = await entry.arrayBuffer(abortSignal);
				const reference = await Reference.fromArrayBuffer(buffer);
				yield [join(path, entry.base), reference] as const;
			}
		}
	}
}
