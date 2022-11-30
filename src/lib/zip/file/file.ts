export enum SeekFrom {
	Start = 0,
	Current = 1,
	End = 2,
}

export interface File {
	seek(offset: number, from: SeekFrom): Promise<number>;
	truncate(length?: number): Promise<void>;
	readIntoBuffer(buffer: Uint8Array): Promise<number>;
	readStream(size: number): Promise<ReadableStream<Uint8Array>>;
	writeBuffer(buffer: Uint8Array): Promise<number>;
	writeStream(): Promise<WritableStream<Uint8Array>>;
	close(): Promise<void>;
}

export class FileClosedError extends Error {
	public name = "FileClosedError";
}
