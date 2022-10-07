export abstract class Filesystem {
	abstract exists(path: string): Promise<boolean>;
	abstract list(path: string): AsyncIterableIterator<string>;
	abstract read(path: string): Promise<ReadableStream>;
	abstract write(path: string): Promise<WritableStream>;
}
