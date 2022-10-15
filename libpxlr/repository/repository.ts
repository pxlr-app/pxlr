import { Filesystem, IOError } from "./filesystem/filesystem.ts";
import { Commit } from "./commit.ts";
import { Object } from "./object.ts";
import { Tree } from "./tree.ts";
import { assertReference, Reference } from "./reference.ts";
import { assertAutoId, AutoId } from "../autoid.ts";

async function readAsText(rs: ReadableStream) {
	return await new Response(rs).text();
}

export class Repository {
	#textEncoder = new TextEncoder();
	#textDecoder = new TextDecoder("utf-8");

	constructor(
		protected readonly fs: Filesystem,
	) {}

	async getHead(abortSignal?: AbortSignal): Promise<Reference> {
		try {
			const headReadableStream = await this.fs.read("/HEAD", abortSignal);
			const ref = await readAsText(headReadableStream);
			assertReference(ref);
			return ref;
		} catch (error) {
			throw new IOError(error);
		}
	}

	async setHead(ref: Reference, abortSignal?: AbortSignal): Promise<void> {
		assertReference(ref);
		try {
			const headWritableStream = await this.fs.write("/HEAD", abortSignal);
			const headWriter = headWritableStream.getWriter();
			await headWriter.write(this.#textEncoder.encode(ref));
			await headWriter.close();
		} catch (error) {
			throw new IOError(error);
		}
	}

	async getReference(ref: Reference, abortSignal?: AbortSignal): Promise<AutoId> {
		assertReference(ref);
		try {
			const refReadableStream = await this.fs.read(`/${ref}`, abortSignal);
			const commitId = await readAsText(refReadableStream);
			assertAutoId(commitId);
			return commitId;
		} catch (error) {
			throw new IOError(error);
		}
	}

	async writeReference(ref: Reference, commitId: AutoId, abortSignal?: AbortSignal): Promise<void> {
		assertReference(ref);
		assertAutoId(commitId);
		try {
			const refWritableStream = await this.fs.write(`/${ref}`, abortSignal);
			const refWriter = refWritableStream.getWriter();
			await refWriter.write(this.#textEncoder.encode(commitId));
			await refWriter.close();
		} catch (error) {
			throw new IOError(error);
		}
	}

	async *listReference(ref: Reference, abortSignal?: AbortSignal): AsyncIterableIterator<Reference> {
		assertReference(ref);
		for await (const entry of this.fs.list(`/${ref}`, abortSignal)) {
			yield `${ref}/${entry}`;
		}
	}

	async getObject(id: AutoId, abortSignal?: AbortSignal): Promise<Object> {
		assertAutoId(id);
		let objectReadableStream;
		try {
			objectReadableStream = await this.fs.read(`/objects/${id[0]}/${id[1]}/${id}`, abortSignal);
		} catch (error) {
			throw new IOError(error);
		}
		return Object.deserialize(objectReadableStream);
	}

	async writeObject(object: Object, abortSignal?: AbortSignal): Promise<void> {
		try {
			const objectWritableStream = await this.fs.write(`/objects/${object.id[0]}/${object.id[1]}/${object.id}`, abortSignal);
			await object.serialize(objectWritableStream);
		} catch (error) {
			throw new IOError(error);
		}
	}

	async objectExists(id: AutoId, abortSignal?: AbortSignal): Promise<boolean> {
		assertAutoId(id);
		try {
			return await this.fs.exists(`/objects/${id[0]}/${id[1]}/${id}`, abortSignal);
		} catch (_error) {
			return false;
		}
	}

	async getCommit(id: AutoId, abortSignal?: AbortSignal): Promise<Commit> {
		const object = await this.getObject(id, abortSignal);
		return Commit.fromObject(object);
	}

	async writeCommit(commit: Commit, abortSignal?: AbortSignal): Promise<void> {
		return await this.writeObject(commit.toObject(), abortSignal);
	}

	async getTree(id: AutoId, abortSignal?: AbortSignal): Promise<Tree> {
		const object = await this.getObject(id, abortSignal);
		return Tree.fromObject(object);
	}

	async writeTree(tree: Tree, abortSignal?: AbortSignal): Promise<void> {
		return await this.writeObject(tree.toObject(), abortSignal);
	}

	async *walkTree(rootId: AutoId, abortSignal?: AbortSignal): AsyncIterableIterator<Tree> {
		const queue: AutoId[] = [rootId];
		for (let id = queue.shift(); id; id = queue.shift()) {
			if (abortSignal?.aborted === true) {
				break;
			}
			const tree = await this.getTree(id, abortSignal);
			for (const item of tree.items) {
				if (item.kind === "tree") {
					queue.push(item.id);
				}
			}
			yield tree;
		}
	}

	async *walkHistory(commitId: AutoId, abortSignal?: AbortSignal): AsyncIterableIterator<Commit> {
		while (commitId) {
			if (abortSignal?.aborted === true) {
				break;
			}
			const commit = await this.getCommit(commitId, abortSignal);
			commitId = commit.parent;
			yield commit;
		}
	}
}
