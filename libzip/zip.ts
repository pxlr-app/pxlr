import {
	CentralDirectoryFileHeader,
	EndOfCentralDirectoryRecord,
	LocalFileHeader,
	PxlrHeader,
	Zip64DataDescriptor,
	Zip64EndOfCentralDirectoryLocator,
	Zip64EndOfCentralDirectoryRecord,
	Zip64ExtensibleDataField,
} from "./block.ts";
import { crc32 } from "./crc32.ts";
import { Lock } from "./lock.ts";
import { File, SeekFrom } from "./file/file.ts";

export type ZipIterOpen =
	| { state: "OPENING"; entriesInThisDisk: number }
	| { state: "READING"; current: number; entry: CentralDirectoryFileHeader };

export type OpenProgressHandlerState =
	| { numberOfentries: number; currentEntryNumber: 0 }
	| {
		numberOfentries: number;
		currentEntryNumber: number;
		entry: CentralDirectoryFileHeader;
	};

export type ZipOptions = {
	centralDirectoryPaddingSize?: number;
};

export class Zip {
	#file: File | undefined;
	#eocdr: EndOfCentralDirectoryRecord | undefined;
	#zeocdl: Zip64EndOfCentralDirectoryLocator | undefined;
	#zeocdr: Zip64EndOfCentralDirectoryRecord | undefined;
	#pxh: PxlrHeader | undefined;
	#centralDirectory: Map<string, CentralDirectoryFileHeader>;
	#isCentralDirectoryDirty: boolean;
	#offsetToCentralDirectory: number;
	#offsetToPxlrHeader: number;
	#writeCursor: number;
	#lock: Lock;
	#options: ZipOptions;
	constructor(file: File, options?: ZipOptions) {
		this.#file = file;
		this.#centralDirectory = new Map();
		this.#offsetToCentralDirectory = 0;
		this.#offsetToPxlrHeader = 0;
		this.#writeCursor = 0;
		this.#isCentralDirectoryDirty = false;
		this.#lock = new Lock();
		this.#options = options ?? {};
	}

	get isBusy() {
		return !this.#lock.isFree;
	}

	async open(
		options?: {
			abortSignal?: AbortSignal;
			onProgress?: (state: OpenProgressHandlerState) => void;
		},
	) {
		const releaseLock = await this.#lock.acquire();
		try {
			if (!this.#file) {
				throw new ZipClosedError();
			}
			const { abortSignal, onProgress } = options ?? {};
			try {
				// Read EndOfCentralDirectoryRecord, Zip64EndOfCentralDirectoryLocator and Zip64EndOfCentralDirectoryRecord
				const offsetEOCDR = await this.#findEndOfCentralDirectoryRecord();
				this.#eocdr = new EndOfCentralDirectoryRecord(-offsetEOCDR);
				await this.#file.seek(offsetEOCDR, SeekFrom.End);
				await this.#file.readIntoBuffer(this.#eocdr.arrayBuffer);
				this.#eocdr.throwIfSignatureMismatch();
				abortSignal?.throwIfAborted();
				this.#offsetToCentralDirectory = this.#eocdr.offsetToCentralDirectory;
				if (
					this.#eocdr.entriesInThisDisk === 0xFFFF ||
					this.#eocdr.totalEntries === 0xFFFF ||
					this.#eocdr.offsetToCentralDirectory === 0xFFFFFFFF ||
					this.#eocdr.sizeOfCentralDirectory === 0xFFFFFFFF
				) {
					this.#zeocdl = new Zip64EndOfCentralDirectoryLocator(20);
					const offsetEOCDL = await this.#file.seek(
						offsetEOCDR - 20,
						SeekFrom.End,
					);
					await this.#file.readIntoBuffer(this.#zeocdl.arrayBuffer);
					this.#zeocdl.throwIfSignatureMismatch();
					abortSignal?.throwIfAborted();
					this.#zeocdr = new Zip64EndOfCentralDirectoryRecord(
						offsetEOCDL - this.#zeocdl.offsetToCentralDirectory,
					);
					await this.#file.seek(
						this.#zeocdl.offsetToCentralDirectory,
						SeekFrom.Start,
					);
					await this.#file.readIntoBuffer(this.#zeocdr.arrayBuffer);
					this.#zeocdr.throwIfSignatureMismatch();
					abortSignal?.throwIfAborted();
					this.#offsetToCentralDirectory = this.#zeocdl.offsetToCentralDirectory;
				}
				try {
					this.#pxh = new PxlrHeader();
					this.#offsetToPxlrHeader = await this.#file.seek(
						this.#offsetToCentralDirectory - this.#pxh.arrayBuffer.byteLength,
						SeekFrom.Start,
					);
					await this.#file.readIntoBuffer(this.#pxh.arrayBuffer);
					this.#pxh.throwIfSignatureMismatch();
					abortSignal?.throwIfAborted();
					this.#writeCursor = this.#offsetToPxlrHeader -
						this.#pxh.sizeOfPadding;
				} catch {
					this.#pxh = undefined;
					this.#offsetToPxlrHeader = this.#offsetToCentralDirectory;
					this.#writeCursor = this.#offsetToCentralDirectory;
				}

				const entriesInThisDisk = this.#zeocdr?.entriesInThisDisk ??
					this.#eocdr.entriesInThisDisk;
				const offsetToCentralDirectory = this.#zeocdr?.offsetToCentralDirectory ??
					this.#eocdr.offsetToCentralDirectory;
				const sizeOfCentralDirectory = this.#zeocdr?.sizeOfCentralDirectory ??
					this.#eocdr.sizeOfCentralDirectory;
				onProgress?.({
					numberOfentries: entriesInThisDisk,
					currentEntryNumber: 0,
					entry: undefined,
				});

				await this.#file.seek(offsetToCentralDirectory, SeekFrom.Start);
				for (
					let i = 0, j = 0;
					i < entriesInThisDisk && j < sizeOfCentralDirectory;
					++i
				) {
					const cdfhFixed = new CentralDirectoryFileHeader(46);
					await this.#file.readIntoBuffer(cdfhFixed.arrayBuffer);
					cdfhFixed.throwIfSignatureMismatch();
					const variableData = new Uint8Array(
						cdfhFixed.fileNameLength + cdfhFixed.extraLength +
							cdfhFixed.commentLength,
					);
					await this.#file.readIntoBuffer(variableData);
					const cdfh = new CentralDirectoryFileHeader(
						46 + variableData.byteLength,
					);
					cdfh.centralDirectoryFileHeaderOffset = offsetToCentralDirectory + j;
					cdfh.arrayBuffer.set(cdfhFixed.arrayBuffer, 0);
					cdfh.arrayBuffer.set(variableData, 46);
					this.#centralDirectory.set(cdfh.fileName, cdfh);
					abortSignal?.throwIfAborted();
					onProgress?.({
						numberOfentries: entriesInThisDisk,
						currentEntryNumber: i,
						entry: cdfh,
					});
					j += 46 + variableData.byteLength;
				}
			} catch (error) {
				if (!(error instanceof EndOfCentralDirectoryRecordNotFoundError)) {
					throw error;
				}
				this.#eocdr = new EndOfCentralDirectoryRecord();
				this.#isCentralDirectoryDirty = true;
			}
		} finally {
			releaseLock();
		}
	}

	async close(): Promise<number> {
		const releaseLock = await this.#lock.acquire();
		try {
			if (!this.#file) {
				throw new ZipClosedError();
			}
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
		} finally {
			releaseLock();
		}
	}

	async #findEndOfCentralDirectoryRecord(offset = -22): Promise<number> {
		if (!this.#file) {
			throw new ZipClosedError();
		}
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
					if (
						view.getUint32(i, true) === EndOfCentralDirectoryRecord.SIGNATURE
					) {
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

	getCentralDirectoryFileHeader(
		fileName: string,
	): Readonly<CentralDirectoryFileHeader> {
		const cdfh = this.#centralDirectory.get(fileName);
		if (!cdfh || cdfh.isDeleted) {
			throw new FileNameNotExistsError(fileName);
		}
		return cdfh;
	}

	*iterCentralDirectoryFileHeader(): IterableIterator<
		Readonly<CentralDirectoryFileHeader>
	> {
		for (const cdfh of this.#centralDirectory.values()) {
			if (!cdfh.isDeleted) {
				yield cdfh;
			}
		}
	}

	async #getLocalFileHeader(
		fileName: string,
		abortSignal?: AbortSignal,
	): Promise<LocalFileHeader> {
		if (!this.#file) {
			throw new ZipClosedError();
		}
		const cdfh = this.getCentralDirectoryFileHeader(fileName);
		let localFileOffset = cdfh.localFileOffset;
		if (localFileOffset === 0xFFFFFFFF) {
			const z64ei = cdfh.getZip64ExtensibleDataField();
			if (z64ei && z64ei.offsetOfLocalHeaderRecord !== null) {
				localFileOffset = z64ei.offsetOfLocalHeaderRecord;
			}
		}
		await this.#file.seek(localFileOffset, SeekFrom.Start);
		abortSignal?.throwIfAborted();
		const lfhFixed = new LocalFileHeader(30);
		await this.#file.readIntoBuffer(lfhFixed.arrayBuffer);
		lfhFixed.throwIfSignatureMismatch();
		const variableData = new Uint8Array(
			lfhFixed.fileNameLength + lfhFixed.extraLength,
		);
		await this.#file.readIntoBuffer(variableData);
		abortSignal?.throwIfAborted();
		const lfh = new LocalFileHeader(30 + variableData.byteLength);
		lfh.arrayBuffer.set(lfhFixed.arrayBuffer, 0);
		lfh.arrayBuffer.set(variableData, 30);
		return lfh;
	}

	async get(fileName: string, abortSignal?: AbortSignal): Promise<Uint8Array> {
		const releaseLock = await this.#lock.acquire();
		try {
			if (!this.#file) {
				throw new ZipClosedError();
			}
			const cdfh = this.getCentralDirectoryFileHeader(fileName);
			const lfh = await this.#getLocalFileHeader(fileName, abortSignal);
			abortSignal?.throwIfAborted();
			const compressedSize = lfh.getCompressedLength(cdfh);
			let compressedData = new Uint8Array(compressedSize);
			await this.#file.readIntoBuffer(compressedData);
			abortSignal?.throwIfAborted();
			if (lfh.compressionMethod === 8) {
				const dataStream = new Response(compressedData).body!;
				const compressionStream = new DecompressionStream("deflate-raw");
				const pipeline = dataStream.pipeThrough(compressionStream);
				compressedData = new Uint8Array(
					await new Response(pipeline).arrayBuffer(),
				);
			}
			releaseLock();
			return compressedData;
		} finally {
			releaseLock();
		}
	}

	async getStream(
		fileName: string,
		abortSignal?: AbortSignal,
	): Promise<ReadableStream<Uint8Array>> {
		const releaseLock = await this.#lock.acquire();
		try {
			if (!this.#file) {
				throw new ZipClosedError();
			}
			const cdfh = this.getCentralDirectoryFileHeader(fileName);
			const lfh = await this.#getLocalFileHeader(fileName, abortSignal);
			const compressedSize = lfh.getCompressedLength(cdfh);
			abortSignal?.throwIfAborted();

			const controllerTransform = new TransformStream<Uint8Array>({
				flush: () => {
					releaseLock();
				},
			});

			if (lfh.compressionMethod === 0) {
				const readableStream = await this.#file.readStream(compressedSize);
				return readableStream.pipeThrough(controllerTransform);
			} else if (lfh.compressionMethod === 8) {
				const readableStream = await this.#file.readStream(compressedSize);
				return readableStream.pipeThrough(
					new DecompressionStream("deflate-raw"),
				).pipeThrough(controllerTransform);
			}
			throw new CompressionMethodNotSupportedError(lfh.compressionMethod);
		} catch (error) {
			releaseLock();
			throw error;
		}
	}

	async put(
		fileName: string,
		data: Uint8Array,
		options?: { compressionMethod: number; abortSignal?: AbortSignal },
	): Promise<number> {
		const releaseLock = await this.#lock.acquire();
		try {
			if (!this.#file) {
				throw new ZipClosedError();
			}
			const { compressionMethod, abortSignal } = options ?? {};
			let compressedData = data;
			if (compressionMethod === 8) {
				const dataStream = new Response(data).body!;
				const compressionStream = new CompressionStream("deflate-raw");
				const pipeline = dataStream.pipeThrough(compressionStream);
				compressedData = new Uint8Array(
					await new Response(pipeline).arrayBuffer(),
				);
			}
			let cdfh: CentralDirectoryFileHeader;
			let lfh: LocalFileHeader;
			let exists = false;
			try {
				cdfh = this.getCentralDirectoryFileHeader(
					fileName,
				) as CentralDirectoryFileHeader;
				lfh = await this.#getLocalFileHeader(fileName);
				exists = true;
			} catch (_) {
				cdfh = new CentralDirectoryFileHeader();
				lfh = new LocalFileHeader();
			}
			const oldCompressedSize = lfh.getCompressedLength(cdfh);
			let localFileOffset = this.#writeCursor;

			// Edit inplace of old LocalFileHeader if compressed size match
			if (exists && compressedData.byteLength === oldCompressedSize) {
				localFileOffset = cdfh.localFileOffset;
			}
			await this.#file.seek(localFileOffset, SeekFrom.Start);
			abortSignal?.throwIfAborted();
			lfh.fileName = fileName;
			lfh.extractedOS = 0; // MS-DOS
			lfh.extractedZipSpec = 0x2D; // 4.5
			lfh.generalPurposeFlag |= 0b10000000000;
			lfh.compressionMethod = compressionMethod ?? 0;
			lfh.lastModificationDate = new Date();
			lfh.crc = crc32(data);
			if (data.byteLength < 0xFFFFFFFF) {
				lfh.uncompressedLength = data.byteLength;
				lfh.compressedLength = compressedData.byteLength;
			} else {
				lfh.uncompressedLength = 0xFFFFFFFF;
				lfh.compressedLength = 0xFFFFFFFF;
				const edfs = cdfh.extensibleDataFields;
				const z64df = new Zip64ExtensibleDataField(20);
				z64df.originalUncompressedData = data.byteLength;
				z64df.sizeOfCompressedData = compressedData.byteLength;
				edfs.addExtensibleDataField(z64df);
				lfh.extensibleDataFields = edfs;
			}
			let byteWritten = 0;
			byteWritten += await this.#file.writeBuffer(lfh.arrayBuffer);
			abortSignal?.throwIfAborted();
			byteWritten += await this.#file.writeBuffer(compressedData);
			abortSignal?.throwIfAborted();
			cdfh.isUpdated = true;
			cdfh.extractedOS = 0; // MS-DOS
			cdfh.extractedZipSpec = 0x2D; // 4.5
			cdfh.extra = lfh.extra;
			cdfh.compressionMethod = lfh.compressionMethod;
			cdfh.lastModificationDate = lfh.lastModificationDate;
			cdfh.crc = lfh.crc;
			cdfh.uncompressedLength = Math.min(0xFFFFFFFF, lfh.uncompressedLength);
			cdfh.compressedLength = Math.min(0xFFFFFFFF, lfh.compressedLength);
			cdfh.localFileOffset = Math.min(0xFFFFFFFF, localFileOffset);
			// TODO only set zip64 when needed
			cdfh.uncompressedLength = 0xFFFFFFFF;
			cdfh.compressedLength = 0xFFFFFFFF;
			cdfh.localFileOffset = 0xFFFFFFFF;
			const edfs = cdfh.extensibleDataFields;
			const z64df = new Zip64ExtensibleDataField(24);
			z64df.offsetOfLocalHeaderRecord = localFileOffset;
			z64df.originalUncompressedData = lfh.uncompressedLength;
			z64df.sizeOfCompressedData = lfh.compressedLength;
			edfs.addExtensibleDataField(z64df);
			cdfh.extensibleDataFields = edfs;
			cdfh.fileName = lfh.fileName;

			this.#centralDirectory.set(fileName, cdfh);
			this.#writeCursor += byteWritten;
			this.#isCentralDirectoryDirty = true;
			return byteWritten;
		} finally {
			releaseLock();
		}
	}

	async putStream(
		fileName: string,
		options?: { compressionMethod: number; abortSignal?: AbortSignal },
	): Promise<WritableStream<Uint8Array>> {
		const releaseLock = await this.#lock.acquire();
		try {
			if (!this.#file) {
				throw new ZipClosedError();
			}
			const { compressionMethod, abortSignal } = options ?? {};
			const localFileOffset = this.#writeCursor;
			let byteWritten = 0;
			await this.#file.seek(localFileOffset, SeekFrom.Start);

			// Write LocalFileHeader
			const lfh = new LocalFileHeader();
			lfh.fileName = fileName;
			lfh.extractedOS = 0; // MS-DOS
			lfh.extractedZipSpec = 0x2D; // 4.5
			lfh.generalPurposeFlag = 0b10000001000;
			lfh.compressionMethod = compressionMethod ?? 0;
			lfh.lastModificationDate = new Date();
			lfh.uncompressedLength = 0xFFFFFFFF;
			lfh.compressedLength = 0xFFFFFFFF;
			byteWritten += await this.#file.writeBuffer(lfh.arrayBuffer);
			this.#isCentralDirectoryDirty = true;

			const z64dd = new Zip64DataDescriptor();

			// Calculate uncompressedSize and crcOfUncompressedData
			const uncompressedTransform = new TransformStream<Uint8Array>({
				transform: (chunk, controller) => {
					z64dd.uncompressedLength += chunk.byteLength;
					z64dd.crc = crc32(chunk, z64dd.crc);
					controller.enqueue(chunk);
				},
			});
			// Calculate compressedSize
			const compressedTransform = new TransformStream<Uint8Array>({
				transform: (chunk, controller) => {
					z64dd.compressedLength += chunk.byteLength;
					controller.enqueue(chunk);
				},
			});

			// Get contentWritableStream
			const contentWritableStream = await this.#file.writeStream();

			// Setup pipeline
			if (lfh.compressionMethod === 8) {
				const compressionTransform = new CompressionStream("deflate-raw");
				uncompressedTransform.readable.pipeThrough(compressionTransform, {
					signal: abortSignal,
				});
				compressionTransform.readable.pipeThrough(compressedTransform, {
					signal: abortSignal,
				});
			} else {
				uncompressedTransform.readable.pipeThrough(compressedTransform, {
					signal: abortSignal,
				});
			}
			const pipeline = compressedTransform.readable.pipeTo(
				contentWritableStream,
				{ signal: abortSignal },
			);
			const contentWriter = uncompressedTransform.writable.getWriter();

			return new WritableStream({
				write: async (chunk) => {
					await contentWriter.write(chunk);
				},
				close: async () => {
					// Close and wait for pipeline to finish up
					await contentWriter.close();
					await pipeline;

					byteWritten += z64dd.compressedLength;

					// Write DataDescriptor
					byteWritten += await this.#file!.writeBuffer(z64dd.arrayBuffer);

					// Write CentralDirectoryFileHeader
					let cdfh: CentralDirectoryFileHeader;
					try {
						cdfh = this.getCentralDirectoryFileHeader(
							fileName,
						) as CentralDirectoryFileHeader;
					} catch (_) {
						cdfh = new CentralDirectoryFileHeader();
					}
					cdfh.isUpdated = true;
					cdfh.generalPurposeFlag = lfh.generalPurposeFlag;
					cdfh.compressionMethod = lfh.compressionMethod;
					cdfh.lastModificationDate = lfh.lastModificationDate;
					cdfh.crc = z64dd.crc;
					cdfh.localFileOffset = localFileOffset;
					cdfh.uncompressedLength = z64dd.uncompressedLength;
					cdfh.compressedLength = z64dd.compressedLength;
					// TODO only set zip64 when needed
					cdfh.uncompressedLength = 0xFFFFFFFF;
					cdfh.compressedLength = 0xFFFFFFFF;
					cdfh.localFileOffset = 0xFFFFFFFF;
					const edf = cdfh.extensibleDataFields;
					const z64df = new Zip64ExtensibleDataField(24);
					z64df.offsetOfLocalHeaderRecord = localFileOffset;
					z64df.originalUncompressedData = z64dd.uncompressedLength;
					z64df.sizeOfCompressedData = z64dd.compressedLength;
					edf.addExtensibleDataField(z64df);
					cdfh.fileName = lfh.fileName;
					cdfh.extensibleDataFields = edf;
					this.#centralDirectory.set(fileName, cdfh);

					this.#writeCursor += byteWritten;
					releaseLock();
				},
			});
		} catch (error) {
			releaseLock();
			throw error;
		}
	}

	async remove(fileName: string): Promise<void> {
		const releaseLock = await this.#lock.acquire();
		try {
			if (!this.#file) {
				throw new ZipClosedError();
			}
			const cdfh = this.#centralDirectory.get(fileName);
			if (cdfh) {
				cdfh.isDeleted = true;
				this.#isCentralDirectoryDirty = true;
			}
		} finally {
			releaseLock();
		}
	}

	async rename(fileName: string, rename: string): Promise<void> {
		const releaseLock = await this.#lock.acquire();
		try {
			if (!this.#file) {
				throw new ZipClosedError();
			}
			const cdfh = this.#centralDirectory.get(fileName);
			if (cdfh) {
				cdfh.fileName = rename;
				cdfh.isUpdated = true;
				this.#isCentralDirectoryDirty = true;
			}
		} finally {
			releaseLock();
		}
	}

	async #writeCentralDirectory(abortSignal?: AbortSignal) {
		if (!this.#file || !this.#eocdr || !this.#isCentralDirectoryDirty) {
			throw new ZipClosedError();
		}
		let byteWritten = 0;
		// Handle central directory padding or maintain it
		if (
			this.#pxh ||
			this.#options.centralDirectoryPaddingSize &&
				this.#options.centralDirectoryPaddingSize > 0
		) {
			const sizeOfPadding = this.#pxh?.sizeOfPadding ?? 0;
			const offsetToPaddingStart = this.#offsetToPxlrHeader - sizeOfPadding;
			const currentPaddingSize = Math.max(
				0,
				this.#offsetToPxlrHeader - this.#writeCursor,
			);
			const offsetToPaddingEnd = offsetToPaddingStart + currentPaddingSize;
			if (this.#writeCursor >= offsetToPaddingEnd) {
				if (this.#options.centralDirectoryPaddingSize) {
					await this.#file.seek(this.#writeCursor, SeekFrom.Start);
					this.#writeCursor += await this.#file.writeBuffer(
						new Uint8Array(this.#options.centralDirectoryPaddingSize),
					);
					this.#pxh = new PxlrHeader();
					this.#pxh.sizeOfPadding = this.#options.centralDirectoryPaddingSize;
					this.#offsetToPxlrHeader = this.#writeCursor;
					this.#writeCursor += await this.#file.writeBuffer(
						this.#pxh.arrayBuffer,
					);
					byteWritten += this.#options.centralDirectoryPaddingSize +
						this.#pxh.arrayBuffer.byteLength;
				}
			} else {
				await this.#file.seek(this.#offsetToPxlrHeader, SeekFrom.Start);
				this.#pxh = new PxlrHeader();
				this.#pxh.sizeOfPadding = currentPaddingSize;
				await this.#file.writeBuffer(this.#pxh.arrayBuffer);
			}
		}
		let startOfCentralDirectory = Math.max(
			this.#offsetToCentralDirectory,
			this.#writeCursor,
		);

		let offset = startOfCentralDirectory;
		let firstNonCorruptedCDFH = true;
		for (const [key, cdfh] of this.#centralDirectory.entries()) {
			if (cdfh.centralDirectoryFileHeaderOffset >= this.#writeCursor) {
				if (
					!cdfh.isDeleted &&
					(firstNonCorruptedCDFH ||
						offset === cdfh.centralDirectoryFileHeaderOffset)
				) {
					if (firstNonCorruptedCDFH) {
						firstNonCorruptedCDFH = false;
						offset = cdfh.centralDirectoryFileHeaderOffset;
						startOfCentralDirectory = offset;
						await this.#file.seek(offset, SeekFrom.Start);
					}
					if (cdfh.isUpdated) {
						byteWritten += await this.#file.writeBuffer(cdfh.arrayBuffer);
					} else {
						await this.#file.seek(
							cdfh.arrayBuffer.byteLength,
							SeekFrom.Current,
						);
					}
					offset += cdfh.arrayBuffer.byteLength;
				} else if (!cdfh.isDeleted) {
					byteWritten += await this.#file.writeBuffer(cdfh.arrayBuffer);
					offset += cdfh.arrayBuffer.byteLength;
				} else if (cdfh.isDeleted) {
					this.#centralDirectory.delete(key);
				}
			}
		}
		await this.#file.seek(offset, SeekFrom.Start);
		for (const cdfh of this.#centralDirectory.values()) {
			if (cdfh.centralDirectoryFileHeaderOffset < this.#writeCursor) {
				byteWritten += await this.#file.writeBuffer(cdfh.arrayBuffer);
			}
		}
		const endOfCentralDirectory = await this.#file.seek(0, SeekFrom.Current);

		// Setup EndOfCentralDirectoryRecord
		const eocdr = new EndOfCentralDirectoryRecord();
		eocdr.comment = this.#eocdr.comment ?? "";
		eocdr.entriesInThisDisk = Math.min(0xFFFF, this.#centralDirectory.size);
		eocdr.totalEntries = Math.min(0xFFFF, eocdr.entriesInThisDisk);
		eocdr.offsetToCentralDirectory = Math.min(
			0xFFFFFFFF,
			startOfCentralDirectory,
		);
		eocdr.sizeOfCentralDirectory = Math.min(
			0xFFFFFFFF,
			endOfCentralDirectory - startOfCentralDirectory,
		);
		// ZIP64 transition
		if (
			eocdr.entriesInThisDisk === 0xFFFF ||
			eocdr.totalEntries === 0xFFFF ||
			eocdr.offsetToCentralDirectory === 0xFFFFFFFF ||
			eocdr.sizeOfCentralDirectory === 0xFFFFFFFF
		) {
			// Write Zip64EndOfCentralDirectoryRecord
			const zeocdr = new Zip64EndOfCentralDirectoryRecord();
			zeocdr.comment = this.#zeocdr?.comment ?? this.#eocdr.comment;
			zeocdr.entriesInThisDisk = this.#centralDirectory.size;
			zeocdr.totalEntries = zeocdr.entriesInThisDisk;
			zeocdr.offsetToCentralDirectory = startOfCentralDirectory;
			zeocdr.sizeOfCentralDirectory = endOfCentralDirectory -
				startOfCentralDirectory;
			zeocdr.createdOS = 0; // MS-DOS
			zeocdr.createdZipSpec = 0x2D; // 4.5
			zeocdr.extractedOS = 0; // MS-DOS
			zeocdr.extractedZipSpec = 0x2D; // 4.5
			await this.#file.writeBuffer(zeocdr.arrayBuffer);
			byteWritten += zeocdr.arrayBuffer.byteLength;
			abortSignal?.throwIfAborted();
			this.#zeocdr = zeocdr;
			// Write Zip64EndOfCentralDirectoryLocator
			const zeocdl = new Zip64EndOfCentralDirectoryLocator();
			zeocdl.offsetToCentralDirectory = endOfCentralDirectory;
			zeocdl.totalNumberOfDisk = 1;
			await this.#file.writeBuffer(zeocdl.arrayBuffer);
			byteWritten += zeocdl.arrayBuffer.byteLength;
			abortSignal?.throwIfAborted();
			this.#zeocdl = zeocdl;
		}
		// Write EndOfCentralDirectoryRecord
		await this.#file.writeBuffer(eocdr.arrayBuffer);
		byteWritten += eocdr.arrayBuffer.byteLength;
		abortSignal?.throwIfAborted();
		this.#eocdr = eocdr;
		this.#offsetToCentralDirectory = this.#eocdr.offsetToCentralDirectory;
		this.#isCentralDirectoryDirty = false;

		const endOfFile = await this.#file.seek(0, SeekFrom.Current);
		await this.#file.truncate(endOfFile);

		return byteWritten;
	}
}

export class ZipClosedError extends Error {}
export class ZipNotReadyError extends Error {}
export class EndOfCentralDirectoryRecordNotFoundError extends Error {}
export class FileNameNotExistsError extends Error {}
export class CompressionMethodNotSupportedError extends Error {
	public name = "CompressionMethodNotSupportedError";
	public constructor(compressionMethod: unknown) {
		super(`Compression method "${compressionMethod}" not supported.`);
	}
}
