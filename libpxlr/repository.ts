import { Filesystem, IOError } from "./filesystem/filesystem.ts";
import { Commit } from "./objects/commit.ts";
import { Object } from "./objects/object.ts";
import { Tree } from "./objects/tree.ts";
import { InvalidReferenceError, isReference, Reference } from "./objects/reference.ts";
import { AutoId, InvalidAutoIdError, isAutoId } from "./autoid.ts";

async function readAsText(rs: ReadableStream) {
	return await new Response(rs).text();
}

export class Repository {
	#textEncoder = new TextEncoder();
	#textDecoder = new TextDecoder("utf-8");

	constructor(
		protected readonly fs: Filesystem,
	) {}

	async getHead(): Promise<Reference> {
		try {
			const headReadableStream = await this.fs.read("/HEAD");
			const ref = await readAsText(headReadableStream);
			if (!isReference(ref)) {
				throw new InvalidReferenceError(ref);
			}
			return ref;
		} catch (error) {
			throw new IOError(error);
		}
	}

	async setHead(ref: Reference): Promise<void> {
		if (!isReference(ref)) {
			throw new InvalidReferenceError(ref);
		}
		try {
			const headWritableStream = await this.fs.write("/HEAD");
			const headWriter = headWritableStream.getWriter();
			await headWriter.write(this.#textEncoder.encode(ref));
			await headWriter.close();
		} catch (error) {
			throw new IOError(error);
		}
	}

	async getReference(ref: Reference): Promise<AutoId> {
		if (!isReference(ref)) {
			throw new InvalidReferenceError(ref);
		}
		try {
			const refReadableStream = await this.fs.read(`/${ref}`);
			const commitId = await readAsText(refReadableStream);
			if (!isAutoId(commitId)) {
				throw new InvalidAutoIdError(commitId);
			}
			return commitId;
		} catch (error) {
			throw new IOError(error);
		}
	}

	async setReference(ref: Reference, commitId: AutoId): Promise<void> {
		if (!isReference(ref)) {
			throw new InvalidReferenceError(ref);
		}
		if (!isAutoId(commitId)) {
			throw new InvalidAutoIdError(commitId);
		}
		try {
			const refWritableStream = await this.fs.write(`/${ref}`);
			const refWriter = refWritableStream.getWriter();
			await refWriter.write(this.#textEncoder.encode(commitId));
			await refWriter.close();
		} catch (error) {
			throw new IOError(error);
		}
	}

	async getObject(id: AutoId): Promise<Object> {
		if (!isAutoId(id)) {
			throw new InvalidAutoIdError(id);
		}
		let objectReadableStream;
		try {
			objectReadableStream = await this.fs.read(`/objects/${id[0]}/${id[1]}/${id}`);
		} catch (error) {
			throw new IOError(error);
		}
		return Object.deserialize(objectReadableStream);
	}

	async setObject(object: Object): Promise<void> {
		try {
			const objectWritableStream = await this.fs.write(`/objects/${object.id[0]}/${object.id[1]}/${object.id}`);
			await object.serialize(objectWritableStream);
		} catch (error) {
			throw new IOError(error);
		}
	}

	async getCommit(id: AutoId): Promise<Commit> {
		const object = await this.getObject(id);
		return Commit.fromObject(object);
	}

	async setCommit(commit: Commit): Promise<void> {
		return await this.setObject(commit.toObject());
	}

	async getTree(id: AutoId): Promise<Tree> {
		const object = await this.getObject(id);
		return Tree.fromObject(object);
	}

	async setTree(tree: Tree): Promise<void> {
		return await this.setObject(tree.toObject());
	}
}
