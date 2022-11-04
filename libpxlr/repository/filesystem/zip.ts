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
	async *list(
		prefix: string,
		_abortSignal?: AbortSignal,
	): AsyncIterableIterator<string> {
		const entries = Array.from(
			Array.from(this.#zip.iterCentralDirectoryFileHeader())
				.reduce((list, cdfh) => {
					if (prefix !== "") {
						if (cdfh.fileName.substring(0, prefix.length + 1) === prefix + "/") {
							list.add(cdfh.fileName.substring(prefix.length + 1).split("/").at(0)!);
						}
					} else {
						list.add(cdfh.fileName.split("/").at(0)!);
					}
					return list;
				}, new Set<string>()),
		);
		entries.sort();
		yield* entries;
	}
	read(
		path: string,
		abortSignal?: AbortSignal,
	): Promise<ReadableStream<Uint8Array>> {
		return this.#zip.getStream(path, abortSignal);
	}
	write(
		path: string,
		abortSignal?: AbortSignal,
	): Promise<WritableStream<Uint8Array>> {
		return this.#zip.putStream(path, { compressionMethod: 8, abortSignal });
	}
}
