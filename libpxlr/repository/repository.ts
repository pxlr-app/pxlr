import { Filesystem, IOError } from "./filesystem/filesystem.ts";
import { Commit } from "./commit.ts";
import { Object } from "./object.ts";
import { Tree } from "./tree.ts";
import { assertReference, Reference } from "./reference.ts";
import { assertAutoId, AutoId } from "../autoid.ts";

async function readAsText(rs: ReadableStream) {
	return await new Response(rs).text();
}

const textEncoder = new TextEncoder();
//const textDecoder = new TextDecoder("utf-8");

export class Repository {
	constructor(
		protected readonly fs: Filesystem,
	) {}

	async getReference(reference: Reference, abortSignal?: AbortSignal): Promise<AutoId> {
		assertReference(reference);
		try {
			const refReadableStream = await this.fs.read(`/${reference}`, abortSignal);
			const commitId = await readAsText(refReadableStream);
			assertAutoId(commitId);
			return commitId;
		} catch (error) {
			throw new IOError(error);
		}
	}

	async writeReference(reference: Reference, commitId: AutoId, abortSignal?: AbortSignal): Promise<void> {
		assertReference(reference);
		assertAutoId(commitId);
		try {
			const refWritableStream = await this.fs.write(`/${reference}`, abortSignal);
			const refWriter = refWritableStream.getWriter();
			await refWriter.write(textEncoder.encode(commitId));
			await refWriter.close();
		} catch (error) {
			throw new IOError(error);
		}
	}

	async *listReference(prefix: Reference, abortSignal?: AbortSignal): AsyncIterableIterator<Reference> {
		assertReference(prefix);
		for await (const entry of this.fs.list(`/${prefix}`, abortSignal)) {
			yield `${prefix}/${entry}`;
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
