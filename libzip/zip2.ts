import { CentralDirectoryFileHeader, EndOfCentralDirectoryRecord, LocalFileHeader, Zip64EndOfCentralDirectoryLocator, Zip64EndOfCentralDirectoryRecord, Zip64ExtendedInformation } from "./block.ts";
import { crc32 } from "./crc32.ts";
import { File, SeekFrom } from "./file/file.ts";

export type ZipIterOpen =
	| { state: "OPENING"; entriesInThisDisk: number }
	| { state: "READING"; current: number; entry: CentralDirectoryFileHeader };

export class Zip {
	#file: File | undefined;
	#eocdr: EndOfCentralDirectoryRecord | undefined;
	#zeocdl: Zip64EndOfCentralDirectoryLocator | undefined;
	#zeocdr: Zip64EndOfCentralDirectoryRecord | undefined;
	#centralDirectory: Map<string, CentralDirectoryFileHeader>;
	#isCentralDirectoryDirty: boolean;
	#writeCursor: number;
	constructor(file: File) {
		this.#file = file;
		this.#centralDirectory = new Map();
		this.#writeCursor = 0;
		this.#isCentralDirectoryDirty = false;
	}

	async open(abortSignal?: AbortSignal) {
		for await (const _ of this.iterOpen(abortSignal)) {
			// Do nothing
		}
	}

	async *iterOpen(abortSignal?: AbortSignal): AsyncIterableIterator<ZipIterOpen> {
		if (this.#file) {
			try {
				// Read EndOfCentralDirectoryRecord, Zip64EndOfCentralDirectoryLocator and Zip64EndOfCentralDirectoryRecord
				const offsetEOCDR = await this.#findEndOfCentralDirectoryRecord();
				this.#eocdr = new EndOfCentralDirectoryRecord(-offsetEOCDR);
				await this.#file.seek(offsetEOCDR, SeekFrom.End);
				await this.#file.readIntoBuffer(this.#eocdr.arrayBuffer);
				this.#eocdr.throwIfSignatureMismatch();
				abortSignal?.throwIfAborted();
				this.#writeCursor = this.#eocdr.offsetToCentralDirectory;
				if (this.#eocdr.offsetToCentralDirectory === 0xFFFFFFFF) {
					this.#zeocdl = new Zip64EndOfCentralDirectoryLocator(20);
					const offsetEOCDL = await this.#file.seek(offsetEOCDR - 20, SeekFrom.End);
					await this.#file.readIntoBuffer(this.#zeocdl.arrayBuffer);
					this.#zeocdl.throwIfSignatureMismatch();
					abortSignal?.throwIfAborted();
					this.#zeocdr = new Zip64EndOfCentralDirectoryRecord(offsetEOCDL - this.#zeocdl.offsetToCentralDirectory);
					await this.#file.seek(this.#zeocdl.offsetToCentralDirectory, SeekFrom.Start);
					await this.#file.readIntoBuffer(this.#zeocdr.arrayBuffer);
					this.#zeocdr.throwIfSignatureMismatch();
					abortSignal?.throwIfAborted();
					this.#writeCursor = this.#zeocdl.offsetToCentralDirectory;
				}

				const entriesInThisDisk = this.#zeocdr?.entriesInThisDisk ?? this.#eocdr.entriesInThisDisk;
				const offsetToCentralDirectory = this.#zeocdr?.offsetToCentralDirectory ?? this.#eocdr.offsetToCentralDirectory;
				const sizeOfCentralDirectory = this.#zeocdr?.sizeOfCentralDirectory ?? this.#eocdr.sizeOfCentralDirectory;
				yield { state: "OPENING", entriesInThisDisk };

				console.log(this.#eocdr.toJSON(), this.#eocdr.offsetToCentralDirectory === 0xFFFFFFFF);
				console.log(this.#zeocdl?.toJSON());
				console.log(this.#zeocdr?.toJSON());

				await this.#file.seek(offsetToCentralDirectory, SeekFrom.Start);
				for (let i = 0, j = 0; i < entriesInThisDisk && j < sizeOfCentralDirectory; ++i) {
					const cdfhFixed = new CentralDirectoryFileHeader(46);
					await this.#file.readIntoBuffer(cdfhFixed.arrayBuffer);
					cdfhFixed.throwIfSignatureMismatch();
					const variableData = new Uint8Array(cdfhFixed.fileNameLength + cdfhFixed.extraLength + cdfhFixed.commentLength);
					await this.#file.readIntoBuffer(variableData);
					const cdfh = new CentralDirectoryFileHeader(46 + variableData.byteLength);
					cdfh.arrayBuffer.set(cdfhFixed.arrayBuffer, 0);
					cdfh.arrayBuffer.set(variableData, 46);
					this.#centralDirectory.set(cdfh.fileName, cdfh);
					abortSignal?.throwIfAborted();
					yield { state: "READING", entry: cdfh, current: i };
					j += 46 + variableData.byteLength;
				}
			} catch (error) {
				if (!(error instanceof EndOfCentralDirectoryRecordNotFoundError)) {
					throw error;
				}
				this.#eocdr = new EndOfCentralDirectoryRecord();
				this.#isCentralDirectoryDirty = true;
			}
			return;
		}
		throw new FileClosedError();
	}

	async close(): Promise<number> {
		let byteWritten = 0;
		if (this.#isCentralDirectoryDirty) {
			byteWritten += await this.#writeCentralDirectory();
		}
		this.#file = undefined;
		this.#centralDirectory.clear();
		this.#eocdr = undefined;
		this.#zeocdl = undefined;
		this.#zeocdr = undefined;
		this.#isCentralDirectoryDirty = false;
		return byteWritten;
	}

	async #findEndOfCentralDirectoryRecord(offset = -22): Promise<number> {
		if (this.#file) {
			const buffer = new Uint8Array(1024);
			const view = new DataView(buffer.buffer);
			for (; offset >= -0xFFFF;) {
				try {
					await this.#file.seek(offset, SeekFrom.End);
					const byteRead = await this.#file.readIntoBuffer(buffer);
					if (byteRead === null) {
						break;
					}
					for (let i = 0; i < byteRead; ++i) {
						if (view.getUint32(i, true) === EndOfCentralDirectoryRecord.SIGNATURE) {
							return offset;
						}
					}
					offset -= byteRead;
				} catch (_err) {
					break;
				}
			}
			throw new EndOfCentralDirectoryRecordNotFoundError();
		}
		throw new FileClosedError();
	}

	getCentralDirectoryFileHeader(fileName: string): Readonly<CentralDirectoryFileHeader> {
		const cdfh = this.#centralDirectory.get(fileName);
		if (!cdfh) {
			throw new FileNameNotExistsError(fileName);
		}
		return cdfh;
	}

	async #getLocalFileHeader(fileName: string, abortSignal?: AbortSignal): Promise<LocalFileHeader> {
		if (this.#file) {
			const cdfh = this.getCentralDirectoryFileHeader(fileName);
			await this.#file.seek(cdfh.localFileOffset, SeekFrom.Start);
			abortSignal?.throwIfAborted();
			const lfhFixed = new LocalFileHeader(30);
			await this.#file.readIntoBuffer(lfhFixed.arrayBuffer);
			lfhFixed.throwIfSignatureMismatch();
			const variableData = new Uint8Array(lfhFixed.fileNameLength + lfhFixed.extraLength);
			await this.#file.readIntoBuffer(variableData);
			abortSignal?.throwIfAborted();
			const lfh = new LocalFileHeader(30 + variableData.byteLength);
			lfh.arrayBuffer.set(lfhFixed.arrayBuffer, 0);
			lfh.arrayBuffer.set(variableData, 30);
			return lfh;
		}
		throw new FileClosedError();
	}

	async getStream(fileName: string, abortSignal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
		if (this.#file) {
			const lfh = await this.#getLocalFileHeader(fileName, abortSignal);
			abortSignal?.throwIfAborted();
			if (lfh.compressionMethod === 0) {
				const readableStream = await this.#file.readStream(lfh.compressedLength);
				return readableStream;
			} else if (lfh.compressionMethod === 8) {
				const readableStream = await this.#file.readStream(lfh.compressedLength);
				return readableStream.pipeThrough(new DecompressionStream("deflate-raw"));
			}
			throw new CompressionMethodNotSupportedError(lfh.compressionMethod);
		}
		throw new FileClosedError();
	}

	async put(fileName: string, data: Uint8Array, abortSignal?: AbortSignal): Promise<number> {
		if (this.#file) {
			const localFileOffset = this.#writeCursor;
			await this.#file.seek(localFileOffset, SeekFrom.Start);
			abortSignal?.throwIfAborted();
			let lfh = new LocalFileHeader();
			lfh.fileName = fileName;
			lfh.extractedOS = 0; // MS-DOS
			lfh.extractedZipSpec = 0x2D; // 4.5
			lfh.compressionMethod = 0;
			lfh.lastModificationDate = new Date();
			lfh.crc = crc32(data);
			if (data.byteLength < 0xFFFFFFFF) {
				lfh.uncompressedLength = data.byteLength;
				lfh.compressedLength = data.byteLength;
			} else {
				lfh.uncompressedLength = 0xFFFFFFFF;
				lfh.compressedLength = 0xFFFFFFFF;
				const z64ei = new Zip64ExtendedInformation(20);
				z64ei.originalUncompressedData = data.byteLength;
				z64ei.sizeOfCompressedData = data.byteLength;
				lfh.extra = z64ei.arrayBuffer;
			}
			let byteWritten = 0;
			byteWritten += await this.#file.writeBuffer(lfh.arrayBuffer);
			abortSignal?.throwIfAborted();
			byteWritten += await this.#file.writeBuffer(data);
			abortSignal?.throwIfAborted();
			const cdfh = new CentralDirectoryFileHeader();
			cdfh.fileName = lfh.fileName;
			cdfh.extra = lfh.extra;
			cdfh.compressionMethod = lfh.compressionMethod;
			cdfh.lastModificationDate = lfh.lastModificationDate;
			cdfh.crc = lfh.crc;
			cdfh.uncompressedLength = lfh.uncompressedLength;
			cdfh.compressedLength = lfh.compressedLength;
			cdfh.localFileOffset = localFileOffset;
			this.#centralDirectory.set(fileName, cdfh);
			this.#writeCursor += byteWritten;
			this.#isCentralDirectoryDirty = true;
			return byteWritten;
		}
		throw new FileClosedError();
	}

	// async putStream(fileName: string, abortSignal?: AbortSignal): Promise<WritableStream<Uint8Array>> {
	// 	throw new Error("Not implemented");
	// }

	async #writeCentralDirectory(abortSignal?: AbortSignal) {
		if (this.#file && this.#eocdr && this.#isCentralDirectoryDirty) {
			const startOfCentralDirectory = this.#writeCursor;
			await this.#file.seek(startOfCentralDirectory, SeekFrom.Start);
			abortSignal?.throwIfAborted();
			let byteWritten = 0;
			for (const cdfh of this.#centralDirectory.values()) {
				byteWritten += await this.#file.writeBuffer(cdfh.arrayBuffer);
				abortSignal?.throwIfAborted();
			}
			const endOfCentralDirectory = startOfCentralDirectory + byteWritten;
			// Setup EndOfCentralDirectoryRecord
			const eocdr = new EndOfCentralDirectoryRecord();
			eocdr.comment = this.#eocdr.comment ?? "";
			eocdr.entriesInThisDisk = this.#centralDirectory.size;
			eocdr.totalEntries = eocdr.entriesInThisDisk;
			eocdr.offsetToCentralDirectory = Math.min(0xFFFFFFFF, startOfCentralDirectory);
			eocdr.sizeOfCentralDirectory = Math.min(0xFFFFFFFF, endOfCentralDirectory - startOfCentralDirectory);
			// ZIP64 transition
			if (endOfCentralDirectory + byteWritten >= 0xFFFFFFFF - 1) {
				eocdr.offsetToCentralDirectory = 0xFFFFFFFF;
				// Write Zip64EndOfCentralDirectoryRecord
				const zeocdr = new Zip64EndOfCentralDirectoryRecord();
				zeocdr.comment = this.#zeocdr?.comment ?? this.#eocdr.comment;
				zeocdr.entriesInThisDisk = this.#centralDirectory.size;
				zeocdr.totalEntries = zeocdr.entriesInThisDisk;
				zeocdr.offsetToCentralDirectory = startOfCentralDirectory;
				zeocdr.sizeOfCentralDirectory = endOfCentralDirectory - startOfCentralDirectory;
				zeocdr.createdOS = 0; // MS-DOS
				zeocdr.createdZipSpec = 0x2D; // 4.5
				zeocdr.extractedOS = 0; // MS-DOS
				zeocdr.extractedZipSpec = 0x2D; // 4.5
				byteWritten += await this.#file.writeBuffer(zeocdr.arrayBuffer);
				abortSignal?.throwIfAborted();
				this.#zeocdr = zeocdr;
				// Write Zip64EndOfCentralDirectoryLocator
				const zeocdl = new Zip64EndOfCentralDirectoryLocator();
				zeocdl.offsetToCentralDirectory = endOfCentralDirectory;
				zeocdl.totalNumberOfDisk = 1;
				byteWritten += await this.#file.writeBuffer(zeocdl.arrayBuffer);
				abortSignal?.throwIfAborted();
				this.#zeocdl = zeocdl;
			}
			// Write EndOfCentralDirectoryRecord
			byteWritten += await this.#file.writeBuffer(eocdr.arrayBuffer);
			abortSignal?.throwIfAborted();
			this.#eocdr = eocdr;
			this.#writeCursor = this.#eocdr.offsetToCentralDirectory;

			this.#isCentralDirectoryDirty = false;
			return byteWritten;
		}
		return 0;
	}
}

export class FileClosedError extends Error {}
export class EndOfCentralDirectoryRecordNotFoundError extends Error {}
export class FileNameNotExistsError extends Error {}
export class CompressionMethodNotSupportedError extends Error {
	public name = "CompressionMethodNotSupportedError";
	public constructor(compressionMethod: unknown) {
		super(`Compression method "${compressionMethod}" not supported.`);
	}
}
