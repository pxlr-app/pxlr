import { File, Folder } from "@pxlr/vfs";
import { Blob } from "./blob.ts";
import { Commit } from "./commit.ts";
import { Tree } from "./tree.ts";
import { Reference } from "./reference.ts";
import { join } from "@std/path/join";
import { sha1 } from "@noble/hashes/legacy.js";
import { ObjectWithHash } from "./object.ts";

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

	async getBlob(hash: string, abortSignal?: AbortSignal): Promise<Blob> {
		const file = await this.#root.getFile(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		const blob = await Blob.fromReadableStream(await file.read(1024 * 1024 * 1024, 0, abortSignal));
		return blob;
	}

	async hasObject(hash: string, abortSignal?: AbortSignal): Promise<boolean> {
		try {
			const file = await this.#root.getFile(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
			return file.exists(abortSignal);
		} catch {
			return false;
		}
	}

	async getObjectHash(object: Tree | Blob | Commit, abortSignal?: AbortSignal): Promise<string> {
		const hasher = sha1.create();
		for await (const chunk of object.toReadableStream()) {
			hasher.update(chunk);
		}
		const hash = Array.from(new Uint8Array(hasher.digest()))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return hash;
	}

	async setObject(object: Tree | Blob | Commit, abortSignal?: AbortSignal): Promise<string> {
		const hash = await this.getObjectHash(object, abortSignal);
		return this.unsafe_setObject(hash, object, abortSignal);
	}

	async unsafe_setObject(hash: string, object: Tree | Blob | Commit, abortSignal?: AbortSignal): Promise<string> {
		const file = await this.#root.getFile(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		await object.toReadableStream().pipeTo(await file.write(0, abortSignal));
		return hash;
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

	async getTree(hash: string, abortSignal?: AbortSignal): Promise<Tree> {
		const file = await this.#root.getFile(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`, abortSignal);
		const tree = await Tree.fromReadableStream(await file.read(1024 * 1024 * 1024, 0, abortSignal));
		return tree;
	}

	async *iterTree(tree: string, abortSignal?: AbortSignal): AsyncIterableIterator<ObjectWithHash<Tree>> {
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
			Object.assign(tree, { hash });
			yield tree as ObjectWithHash<Tree>;
		}
	}

	async *iterCommitChain(commit: string, abortSignal?: AbortSignal): AsyncIterableIterator<ObjectWithHash<Commit>> {
		const queue: string[] = [commit];
		for (let hash = queue.shift(); hash; hash = queue.shift()) {
			if (abortSignal?.aborted === true) {
				break;
			}
			const commit = await this.getCommit(hash, abortSignal);
			Object.assign(commit, { hash });
			yield commit as ObjectWithHash<Commit>;
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
