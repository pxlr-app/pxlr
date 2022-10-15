import { Filesystem } from "./filesystem.ts";
import { Zip } from "../../../libzip/mod.ts";

export class ZipFilesystem extends Filesystem {
	#zip: Zip;
	constructor(zip: Zip) {
		super();
		this.#zip = zip;
	}

	async exists(path: string, _abortSignal?: AbortSignal): Promise<boolean> {
		try {
			await this.#zip.getCentralDirectoryFileHeader(path);
			return true;
		} catch (_error) {
			return false;
		}
	}
	async *list(path: string, _abortSignal?: AbortSignal): AsyncIterableIterator<string> {
		const entries = Array.from(
			new Set(
				Array.from(this.#zip.iterCentralDirectoryFileHeaders())
					.filter((cdfh) => cdfh.fileName.substring(0, path.length) === path && cdfh.fileName.substring(path.length, path.length + 1) === "/")
					.map((cdfh) => cdfh.fileName.substring(path.length + 1).split("/").shift()!),
			),
		);
		yield* entries;
	}
	read(path: string, abortSignal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
		return this.#zip.getFile(path, abortSignal);
	}
	write(path: string, abortSignal?: AbortSignal): Promise<WritableStream<Uint8Array>> {
		return this.#zip.putFile({ fileName: path, compressionMethod: 8, abortSignal });
	}
}
