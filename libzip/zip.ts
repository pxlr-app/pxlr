import { crc32 } from "./crc32.ts";
import { File, SeekFrom } from "./file/file.ts";

const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

export class Zip {
	#file: File | undefined;
	#endOfCentralDirectoryRecord: EndOfCentralDirectoryRecord | EndOfCentralDirectoryRecord64 | undefined;
	#offsetEndOfCentralDirectoryRecord: number;
	#offsetOfStartOfCentralDirectory: number;
	#centralDirectoryFileHeaders: CentralDirectoryFileHeader[];
	#isCentralDirectoryCorrupted: boolean;
	constructor(file: File) {
		this.#file = file;
		this.#offsetEndOfCentralDirectoryRecord = 0;
		this.#offsetOfStartOfCentralDirectory = 0;
		this.#centralDirectoryFileHeaders = [];
		this.#isCentralDirectoryCorrupted = false;
	}

	async open(abortSignal?: AbortSignal) {
		if (this.#file) {
			try {
				// Find EndOfCentralDirectoryRecordOffset location
				const [offsetEndOfCentralDirectoryRecord, isZip64] = await this.#findEndOfCentralDirectoryRecord();
				if (isZip64) {
					throw new Error('ZIP64!');
				}
				abortSignal?.throwIfAborted();
				// Goto EndOfCentralDirectoryRecordOffset location
				this.#offsetEndOfCentralDirectoryRecord = await this.#file.seek(offsetEndOfCentralDirectoryRecord, SeekFrom.End);
				// Read and parse EndOfCentralDirectoryRecordOffset
				const endOfCentralDirectoryRecordBytes = new Uint8Array(-offsetEndOfCentralDirectoryRecord);
				await this.#file.readIntoBuffer(endOfCentralDirectoryRecordBytes);
				this.#endOfCentralDirectoryRecord = isZip64
					? EndOfCentralDirectoryRecord64.parse(endOfCentralDirectoryRecordBytes)
					: EndOfCentralDirectoryRecord.parse(endOfCentralDirectoryRecordBytes);
				abortSignal?.throwIfAborted();
				// Move to the start of CentralDirectory
				this.#offsetOfStartOfCentralDirectory = await this.#file.seek(this.#endOfCentralDirectoryRecord.offsetOfStartOfCentralDirectory, SeekFrom.Start);
				// Read CentralDirectory bytes
				const centralDirectoryBytes = new Uint8Array(this.#endOfCentralDirectoryRecord.sizeOfCentralDirectory);
				await this.#file.readIntoBuffer(centralDirectoryBytes);
				abortSignal?.throwIfAborted();
				// Parse each CentralDirectoryFileHeader from bytes
				for (let offset = 0; offset < this.#endOfCentralDirectoryRecord.sizeOfCentralDirectory;) {
					abortSignal?.throwIfAborted();
					const centralDirectoryFileHeader = CentralDirectoryFileHeader.parse(centralDirectoryBytes.slice(offset));
					const variableBufferLength = centralDirectoryFileHeader.fileNameLength + centralDirectoryFileHeader.extraFieldLength + centralDirectoryFileHeader.fileCommentLength;
					const variableBufferBytes = centralDirectoryBytes.slice(offset + 46, offset + 46 + variableBufferLength);
					centralDirectoryFileHeader.parseVariableBuffer(variableBufferBytes);
					if (isZip64) {
						throw new Error("Zip64ExtendedInformationExtraField!!!");
					}
					centralDirectoryFileHeader.offsetCentralDirectoryFileHeader = this.#offsetOfStartOfCentralDirectory + offset;
					offset += 46 + variableBufferLength;
					this.#centralDirectoryFileHeaders.push(centralDirectoryFileHeader);
				}
			} catch (error) {
				if (!(error instanceof EndOfCentralDirectoryRecordNotFoundError)) {
					throw error;
				}
				// Move back to end of file
				this.#offsetOfStartOfCentralDirectory = await this.#file.seek(0, SeekFrom.End);
				this.#offsetEndOfCentralDirectoryRecord = this.#offsetOfStartOfCentralDirectory;
				this.#endOfCentralDirectoryRecord = new EndOfCentralDirectoryRecord();
				this.#endOfCentralDirectoryRecord.offsetOfStartOfCentralDirectory = this.#offsetOfStartOfCentralDirectory;
			}
		}
	}

	async close(): Promise<number> {
		let byteWritten = 0;
		if (this.#isCentralDirectoryCorrupted) {
			byteWritten = await this.#writeEndOfFile();
		}
		this.#file = undefined;
		this.#endOfCentralDirectoryRecord = undefined;
		this.#offsetOfStartOfCentralDirectory = 0;
		this.#centralDirectoryFileHeaders = [];
		this.#isCentralDirectoryCorrupted = false;
		return byteWritten;
	}

	async flush(): Promise<number> {
		if (this.#isCentralDirectoryCorrupted) {
			return await this.#writeEndOfFile();
		}
		return 0;
	}

	*iterCentralDirectoryFileHeaders(): IterableIterator<Readonly<CentralDirectoryFileHeader>> {
		for (const centralDirectoryFileHeader of this.#centralDirectoryFileHeaders) {
			yield centralDirectoryFileHeader;
		}
	}

	getCentralDirectoryFileHeader(fileName: string): Readonly<CentralDirectoryFileHeader> {
		for (const centralDirectoryFileHeader of this.iterCentralDirectoryFileHeaders()) {
			if (centralDirectoryFileHeader.fileName === fileName) {
				return centralDirectoryFileHeader;
			}
		}
		throw new FileNameNotExistsError(fileName);
	}

	async #getLocalFileHeader(fileName: string, abortSignal?: AbortSignal): Promise<[Readonly<CentralDirectoryFileHeader>, Readonly<LocalFileHeader>]> {
		if (this.#file) {
			const centralDirectoryFileHeader = this.getCentralDirectoryFileHeader(fileName);
			await this.#file.seek(centralDirectoryFileHeader.relativeOffsetOfLocalFileHeader, SeekFrom.Start);
			abortSignal?.throwIfAborted();
			const localFileHeaderBytes = new Uint8Array(30);
			await this.#file.readIntoBuffer(localFileHeaderBytes);
			abortSignal?.throwIfAborted();
			const localFileHeader = LocalFileHeader.parse(localFileHeaderBytes);
			const variableBufferLength = localFileHeader.fileNameLength + localFileHeader.extraFieldLength;
			const variableBufferBytes = new Uint8Array(variableBufferLength);
			await this.#file.readIntoBuffer(variableBufferBytes);
			abortSignal?.throwIfAborted();
			localFileHeader.parseVariableBuffer(variableBufferBytes);
			return [centralDirectoryFileHeader, localFileHeader];
		}
		throw new FileNameNotExistsError(fileName);
	}

	async getFile(fileName: string, abortSignal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
		if (this.#file) {
			const [centralDirectoryFileHeader, localFileHeader] = await this.#getLocalFileHeader(fileName, abortSignal);
			const compressedSize = localFileHeader.generalPurposeBitFlag & 0b100 ? localFileHeader.compressedSize : centralDirectoryFileHeader.compressedSize;
			abortSignal?.throwIfAborted();
			if (localFileHeader.compressionMethod === 0) {
				const readableStream = await this.#file.readStream(compressedSize);
				return readableStream;
			} else if (localFileHeader.compressionMethod === 8) {
				const readableStream = await this.#file.readStream(compressedSize);
				return readableStream.pipeThrough(new DecompressionStream("deflate-raw"));
			}
			throw new CompressionMethodNotSupportedError(localFileHeader.compressionMethod);
		}
		throw new FileNameNotExistsError(fileName);
	}

	async putDirectory(options: { fileName: string; fileComment?: string; fileLastModificationDate?: Date; abortSignal?: AbortSignal }): Promise<void> {
		const writableStream = await this.#put({
			...options,
			fileName: options.fileName.replace(/\/+$/, "") + "/",
			compressionMethod: 0,
			generalPurposeBitFlag: 0,
		});
		await writableStream.close();
	}

	putFile(
		options: { fileName: string; fileComment?: string; fileLastModificationDate?: Date; compressionMethod: number; abortSignal?: AbortSignal },
	): Promise<WritableStream<Uint8Array>> {
		return this.#put({
			...options,
			generalPurposeBitFlag: 0,
		});
	}

	async #put(
		{ fileName, extraField, fileComment, fileLastModificationDate, generalPurposeBitFlag, compressionMethod, abortSignal }: {
			fileName: string;
			extraField?: Uint8Array;
			fileComment?: string;
			generalPurposeBitFlag: number;
			compressionMethod: number;
			fileLastModificationDate?: Date;
			abortSignal?: AbortSignal;
		},
	): Promise<WritableStream<Uint8Array>> {
		if (!this.#file || !this.#endOfCentralDirectoryRecord) {
			throw new Error("No more file?!");
		}
		const newLocalFileHeader = new LocalFileHeader();
		const newDataDescriptor = new DataDescriptor64();

		// Move to start of EndOfCentralDirectoryRecordOffset
		const offsetOfLocalFileHeader = await this.#file.seek(this.#offsetOfStartOfCentralDirectory, SeekFrom.Start);
		// Write LocalFileHeader
		newLocalFileHeader.versionNeededToExtract = 10;
		newLocalFileHeader.generalPurposeBitFlag = generalPurposeBitFlag | 0b1000;
		newLocalFileHeader.compressionMethod = compressionMethod;
		newLocalFileHeader.fileLastModificationDate = fileLastModificationDate ?? new Date();
		newLocalFileHeader.fileName = fileName;
		newLocalFileHeader.compressedSize = 0xFFFFFFFF;
		newLocalFileHeader.uncompressedSize = 0xFFFFFFFF;
		newLocalFileHeader.extraField = extraField ?? new Uint8Array();
		const localFileHeaderBytes = newLocalFileHeader.toBuffer();
		await this.#file.writeBuffer(localFileHeaderBytes);
		this.#isCentralDirectoryCorrupted = true;

		// Calculate uncompressedSize and crcOfUncompressedData
		const uncompressedTransform = new TransformStream<Uint8Array>({
			transform: (chunk, controller) => {
				newDataDescriptor.uncompressedSize += chunk.byteLength;
				newDataDescriptor.crcOfUncompressedData = crc32(chunk, newDataDescriptor.crcOfUncompressedData);
				controller.enqueue(chunk);
			},
		});
		// Calculate compressedSize
		const compressedTransform = new TransformStream<Uint8Array>({
			transform: (chunk, controller) => {
				newDataDescriptor.compressedSize += chunk.byteLength;
				controller.enqueue(chunk);
			},
		});

		// Get contentWritableStream
		const contentWritableStream = await this.#file.writeStream();

		// Setup pipeline
		if (newLocalFileHeader.compressionMethod === 8) {
			const compressionTransform = new CompressionStream("deflate-raw");
			uncompressedTransform.readable.pipeThrough(compressionTransform, { signal: abortSignal });
			compressionTransform.readable.pipeThrough(compressedTransform, { signal: abortSignal });
		} else {
			uncompressedTransform.readable.pipeThrough(compressedTransform, { signal: abortSignal });
		}
		const pipeline = compressedTransform.readable.pipeTo(contentWritableStream, { signal: abortSignal });

		// Get contentWriter
		const contentWriter = uncompressedTransform.writable.getWriter();
		return new WritableStream({
			write: async (chunk) => {
				// Pipe chunk to contentWriter and it's pipeline
				await contentWriter.write(chunk);
			},
			close: async () => {
				// Close and wait for pipeline to finish up
				await contentWriter.close();
				await pipeline;

				// Write DataDescriptor
				const newDataDescriptorBytes = newDataDescriptor.toBuffer();
				await this.#file!.writeBuffer(newDataDescriptorBytes);

				// Keep track of newOffsetOfStartOfCentralDirectory
				this.#offsetOfStartOfCentralDirectory = await this.#file!.seek(0, SeekFrom.Current);

				// Upsert new CentralDirectoryFileHeader
				let centralDirectoryFileHeader = this.#centralDirectoryFileHeaders.find((cdfh) => cdfh.fileName === newLocalFileHeader.fileName);
				if (!centralDirectoryFileHeader) {
					centralDirectoryFileHeader = new CentralDirectoryFileHeader();
					this.#centralDirectoryFileHeaders.push(centralDirectoryFileHeader);
				}
				centralDirectoryFileHeader.versionMadeBy = 798;
				centralDirectoryFileHeader.versionNeededToExtract = newLocalFileHeader.versionNeededToExtract;
				centralDirectoryFileHeader.generalPurposeBitFlag = newLocalFileHeader.generalPurposeBitFlag;
				centralDirectoryFileHeader.fileLastModificationDate = newLocalFileHeader.fileLastModificationDate;
				centralDirectoryFileHeader.compressionMethod = newLocalFileHeader.compressionMethod;
				centralDirectoryFileHeader.crcOfUncompressedData = newDataDescriptor.crcOfUncompressedData;
				centralDirectoryFileHeader.uncompressedSize = 0xFFFFFFFF;
				centralDirectoryFileHeader.compressedSize = 0xFFFFFFFF;
				centralDirectoryFileHeader.relativeOffsetOfLocalFileHeader = 0xFFFFFFFF;
				centralDirectoryFileHeader.extraField = newDataDescriptor.toBuffer(true, true);
				if (
					centralDirectoryFileHeader.fileName !== newLocalFileHeader.fileName ||
					centralDirectoryFileHeader.fileComment !== fileComment ||
					!equalsArrayBuffer(centralDirectoryFileHeader.extraField, newLocalFileHeader.extraField)
				) {
					centralDirectoryFileHeader.offsetCentralDirectoryFileHeader = 0;
					centralDirectoryFileHeader.fileName = newLocalFileHeader.fileName;
					centralDirectoryFileHeader.fileComment = fileComment ?? "";
				}
			},
		});
	}

	async #writeEndOfFile(): Promise<number> {
		// Sort central directory file header based on their offset
		this.#centralDirectoryFileHeaders.sort((a, b) => b.offsetCentralDirectoryFileHeader - a.offsetCentralDirectoryFileHeader);
		// Find corrupted central directory file header
		const corruptedCentralDirectoryFileHeaders: CentralDirectoryFileHeader[] = [];
		const uncorruptedCentralDirectoryFileHeaders: CentralDirectoryFileHeader[] = [];
		for (const cdfh of this.#centralDirectoryFileHeaders) {
			const prevUncorrupted = uncorruptedCentralDirectoryFileHeaders.at(-1);
			if (
				// Was overritten
				cdfh.offsetCentralDirectoryFileHeader < this.#offsetOfStartOfCentralDirectory ||
				// or a hole was introduced by modifying existing central directory file header
				(prevUncorrupted &&
					prevUncorrupted.offsetCentralDirectoryFileHeader + 46 + prevUncorrupted.fileNameLength + prevUncorrupted.extraFieldLength + prevUncorrupted.fileCommentLength ===
						cdfh.offsetCentralDirectoryFileHeader)
			) {
				corruptedCentralDirectoryFileHeaders.push(cdfh);
			} else {
				uncorruptedCentralDirectoryFileHeaders.push(cdfh);
			}
		}

		// Figure out start of central directory file headers
		const offsetOfStartOfCentralDirectoryFileHeaders = Math.max(
			this.#offsetOfStartOfCentralDirectory,
			uncorruptedCentralDirectoryFileHeaders.length ? Math.min(...uncorruptedCentralDirectoryFileHeaders.map((i) => i.offsetCentralDirectoryFileHeader)) : 0,
		);
		// Figure out end of central directory file headers
		let offsetOfEndOfCentralDirectoryFileHeaders = Math.max(
			this.#offsetOfStartOfCentralDirectory,
			...uncorruptedCentralDirectoryFileHeaders.map((i) => i.offsetCentralDirectoryFileHeader + 46 + i.fileNameLength + i.extraFieldLength + i.fileCommentLength),
		);

		await this.#file!.seek(offsetOfEndOfCentralDirectoryFileHeaders, SeekFrom.Start);

		// Write corrupted CentralDirectoryFileHeaders
		let byteWritten = 0;
		for (const centralDirectoryFileHeader of corruptedCentralDirectoryFileHeaders) {
			const centralDirectoryFileHeaderBytes = centralDirectoryFileHeader.toBuffer();
			centralDirectoryFileHeader.offsetCentralDirectoryFileHeader = offsetOfEndOfCentralDirectoryFileHeaders + byteWritten;
			await this.#file!.writeBuffer(centralDirectoryFileHeaderBytes);
			byteWritten += centralDirectoryFileHeaderBytes.byteLength;
		}
		offsetOfEndOfCentralDirectoryFileHeaders += byteWritten;

		// Update and write EndOfCentralDirectoryRecord
		this.#offsetOfStartOfCentralDirectory = offsetOfStartOfCentralDirectoryFileHeaders;
		this.#offsetEndOfCentralDirectoryRecord = offsetOfEndOfCentralDirectoryFileHeaders;
		const endOfCentralDirectoryRecord = new EndOfCentralDirectoryRecord64();
		endOfCentralDirectoryRecord.versionMadeBy = 768;
		endOfCentralDirectoryRecord.versionNeededToExtract = 10;
		endOfCentralDirectoryRecord.offsetOfStartOfCentralDirectory = this.#offsetOfStartOfCentralDirectory;
		endOfCentralDirectoryRecord.sizeOfCentralDirectory = offsetOfEndOfCentralDirectoryFileHeaders - offsetOfStartOfCentralDirectoryFileHeaders;
		endOfCentralDirectoryRecord.numberOfCentralDirectoryRecords = this.#centralDirectoryFileHeaders.length;
		endOfCentralDirectoryRecord.totalNumberOfCentralDirectoryRecords = this.#endOfCentralDirectoryRecord!.numberOfCentralDirectoryRecords;
		endOfCentralDirectoryRecord.comment = this.#endOfCentralDirectoryRecord?.comment ?? "";
		const endOfCentralDirectoryRecordBytes = this.#endOfCentralDirectoryRecord!.toBuffer();
		await this.#file!.writeBuffer(endOfCentralDirectoryRecordBytes);
		byteWritten += endOfCentralDirectoryRecordBytes.byteLength;

		this.#isCentralDirectoryCorrupted = false;

		return byteWritten;
	}

	async #findEndOfCentralDirectoryRecord(): Promise<[number, boolean]> {
		if (this.#file) {
			const buffer = new Uint8Array(1024);
			const view = new DataView(buffer.buffer);
			for (let offset = 22; offset < 0xFFFF;) {
				try {
					await this.#file.seek(-offset, SeekFrom.End);
					const byteRead = await this.#file.readIntoBuffer(buffer);
					if (byteRead === null) {
						break;
					}
					for (let i = 0; i < byteRead; ++i) {
						const signature = view.getUint32(i, true);
						if (signature === EndOfCentralDirectoryRecordSignature) {
							return [-offset, false];
						} else if (signature === EndOfCentralDirectoryRecord64Signature) {
							return [-offset, true];
						}
					}
					offset += byteRead;
				} catch (_err) {
					break;
				}
			}
		}
		throw new EndOfCentralDirectoryRecordNotFoundError();
	}
}

export class EndOfCentralDirectoryRecordNotFoundError extends Error {
	public name = "EndOfCentralDirectoryRecordNotFoundError";
}

export class FileNameNotExistsError extends Error {
	public name = "FileNameNotExistsError";
	public constructor(fileName: unknown) {
		super(`File name "${fileName}" does not exists.`);
	}
}

export class CompressionMethodNotSupportedError extends Error {
	public name = "CompressionMethodNotSupportedError";
	public constructor(compressionMethod: unknown) {
		super(`Compression method "${compressionMethod}" not supported.`);
	}
}

const EndOfCentralDirectoryRecordSignature = 0x06054b50;
const EndOfCentralDirectoryRecord64Signature = 0x06064b50;
const CentralDirectoryFileHeaderSignature = 0x02014b50;
const LocalFileHeaderSignature = 0x04034b50;
const DataDescriptorSignature = 0x08074b50;
const Zip64ExtendedInformationExtraFieldSignature = 0x0001;

/**
 * End of central directory record
 * {@link https://en.wikipedia.org/wiki/ZIP_(file_format)#End_of_central_directory_record_.28EOCD.29}
 */
export class EndOfCentralDirectoryRecord {
	/**
	 * Number of this disk
	 */
	numberOfThisDisk = 0;
	/**
	 * Disk where central directory starts
	 */
	diskNumberWhereCentralDirectoryStarts = 0;
	/**
	 * Number of central directory records on this disk
	 */
	numberOfCentralDirectoryRecords = 0;
	/**
	 * Total number of central directory records
	 */
	totalNumberOfCentralDirectoryRecords = 0;
	/**
	 * Size of central directory (bytes)
	 */
	sizeOfCentralDirectory = 0;
	/**
	 * Offset of start of central directory, relative to start of archive
	 */
	offsetOfStartOfCentralDirectory = 0;
	/**
	 * Comment length
	 */
	commentLength = 0;
	/**
	 * Comment
	 */
	comment = "";

	/**
	 * Parse buffer into EndOfCentralDirectoryRecord
	 */
	static parse(buffer: Uint8Array): EndOfCentralDirectoryRecord {
		const view = new DataView(buffer.buffer);
		if (view.getUint32(0, true) !== EndOfCentralDirectoryRecordSignature) {
			throw new SyntaxError(`Could not parse EndOfCentralDirectoryRecord, wrong signature.`);
		}
		const eocdr = new EndOfCentralDirectoryRecord();
		eocdr.numberOfThisDisk = view.getUint16(4, true);
		eocdr.diskNumberWhereCentralDirectoryStarts = view.getUint16(6, true);
		eocdr.numberOfCentralDirectoryRecords = view.getUint16(8, true);
		eocdr.totalNumberOfCentralDirectoryRecords = view.getUint16(10, true);
		eocdr.sizeOfCentralDirectory = view.getUint32(12, true);
		eocdr.offsetOfStartOfCentralDirectory = view.getUint32(16, true);
		eocdr.commentLength = view.getUint16(20, true);
		const commentBytes = buffer.slice(22, 22 + eocdr.commentLength);
		eocdr.comment = textDecoder.decode(commentBytes);
		return eocdr;
	}

	toBuffer(): Uint8Array {
		const commentBytes = textEncoder.encode(this.comment);
		this.commentLength = commentBytes.byteLength;
		const buffer = new Uint8Array(22 + this.commentLength);
		const view = new DataView(buffer.buffer);
		view.setUint32(0, EndOfCentralDirectoryRecordSignature, true);
		view.setUint16(4, this.numberOfThisDisk, true);
		view.setUint16(6, this.diskNumberWhereCentralDirectoryStarts, true);
		view.setUint16(8, this.numberOfCentralDirectoryRecords, true);
		view.setUint16(10, this.totalNumberOfCentralDirectoryRecords, true);
		view.setUint32(12, this.sizeOfCentralDirectory, true);
		view.setUint32(16, this.offsetOfStartOfCentralDirectory, true);
		view.setUint16(20, this.commentLength, true);
		buffer.set(commentBytes, 22);
		return buffer;
	}
}

/**
 * End of central directory record 64
 * {@link https://en.wikipedia.org/wiki/ZIP_(file_format)#ZIP64}
 */
export class EndOfCentralDirectoryRecord64 {
	/**
	 * Size of the EOCD64 minus 12
	 */
	sizeOfEOCDR64 = 0;
	/**
	 * Version made by
	 */
	versionMadeBy = 0;
	/**
	 * Version needed to extract
	 */
	versionNeededToExtract = 0;
	/**
	 * Number of this disk
	 */
	numberOfThisDisk = 0;
	/**
	 * Disk where central directory starts
	 */
	diskNumberWhereCentralDirectoryStarts = 0;
	/**
	 * Number of central directory records on this disk
	 */
	numberOfCentralDirectoryRecords = 0;
	/**
	 * Total number of central directory records
	 */
	totalNumberOfCentralDirectoryRecords = 0;
	/**
	 * Size of central directory (bytes)
	 */
	sizeOfCentralDirectory = 0;
	/**
	 * Offset of start of central directory, relative to start of archive
	 */
	offsetOfStartOfCentralDirectory = 0;
	/**
	 * Comment
	 */
	comment = "";

	/**
	 * Parse buffer into EndOfCentralDirectoryRecord64
	 */
	static parse(buffer: Uint8Array): EndOfCentralDirectoryRecord64 {
		const view = new DataView(buffer.buffer);
		if (view.getUint32(0, true) !== EndOfCentralDirectoryRecord64Signature) {
			throw new SyntaxError(`Could not parse EndOfCentralDirectoryRecord64, wrong signature.`);
		}
		const eocdr = new EndOfCentralDirectoryRecord64();
		eocdr.sizeOfEOCDR64 = Number(view.getBigUint64(4, true));
		eocdr.versionMadeBy = view.getUint16(12, true);
		eocdr.versionNeededToExtract = view.getUint16(14, true);
		eocdr.numberOfThisDisk = view.getUint32(16, true);
		eocdr.diskNumberWhereCentralDirectoryStarts = view.getUint32(20, true);
		eocdr.numberOfCentralDirectoryRecords = Number(view.getBigUint64(24, true));
		eocdr.totalNumberOfCentralDirectoryRecords = Number(view.getBigUint64(32, true));
		eocdr.sizeOfCentralDirectory = Number(view.getBigUint64(40, true));
		eocdr.offsetOfStartOfCentralDirectory = Number(view.getBigUint64(48, true));
		const commentBytes = buffer.slice(56, 56 + eocdr.sizeOfEOCDR64);
		eocdr.comment = textDecoder.decode(commentBytes);
		return eocdr;
	}

	toBuffer(): Uint8Array {
		const commentBytes = textEncoder.encode(this.comment);
		this.sizeOfEOCDR64 = 56 + commentBytes.byteLength;
		const buffer = new Uint8Array(this.sizeOfEOCDR64);
		const view = new DataView(buffer.buffer);
		view.setUint32(0, EndOfCentralDirectoryRecord64Signature, true);
		view.setBigUint64(4, BigInt(this.sizeOfEOCDR64), true);
		view.setUint16(12, this.versionMadeBy, true);
		view.setUint16(14, this.versionNeededToExtract, true);
		view.setUint32(16, this.numberOfThisDisk, true);
		view.setUint32(20, this.diskNumberWhereCentralDirectoryStarts, true);
		view.setBigUint64(24, BigInt(this.numberOfCentralDirectoryRecords), true);
		view.setBigUint64(32, BigInt(this.totalNumberOfCentralDirectoryRecords), true);
		view.setBigUint64(40, BigInt(this.sizeOfCentralDirectory), true);
		view.setBigUint64(48, BigInt(this.offsetOfStartOfCentralDirectory), true);
		buffer.set(commentBytes, 56);
		return buffer;
	}
}

/**
 * Central directory file header
 * {@link https://en.wikipedia.org/wiki/ZIP_(file_format)#Central_directory_file_header}
 */
export class CentralDirectoryFileHeader {
	/**
	 * Version made by
	 */
	versionMadeBy = 0;
	/**
	 * Version needed to extract
	 */
	versionNeededToExtract = 0;
	/**
	 * General purpose bit flag
	 */
	generalPurposeBitFlag = 0;
	/**
	 * Compression method
	 */
	compressionMethod = 0;
	/**
	 * File last modification date
	 */
	fileLastModificationDate = new Date();
	/**
	 * CRC-32 of uncompressed data
	 */
	crcOfUncompressedData = 0;
	/**
	 * Compressed size
	 */
	compressedSize = 0;
	/**
	 * Uncompressed size
	 */
	uncompressedSize = 0;
	/**
	 * File name length
	 */
	fileNameLength = 0;
	/**
	 * Extra field length
	 */
	extraFieldLength = 0;
	/**
	 * File comment length
	 */
	fileCommentLength = 0;
	/**
	 * Disk number where file starts
	 */
	diskNumberWhereFileStarts = 0;
	/**
	 * Internal file attributes
	 */
	internalFileAttributes = 0;
	/**
	 * External file attributes
	 */
	externalFileAttributes = 0;
	/**
	 * Relative offset of local file header.
	 */
	relativeOffsetOfLocalFileHeader = 0;
	/**
	 * Absolute offset of central directory file header.
	 */
	offsetCentralDirectoryFileHeader = 0;
	/**
	 * File name
	 */
	fileName = "";
	/**
	 * Extra field
	 */
	extraField = new Uint8Array(0);
	/**
	 * File comment
	 */
	fileComment = "";

	/**
	 * Parse buffer into CentralDirectoryFileHeader
	 */
	static parse(buffer: Uint8Array): CentralDirectoryFileHeader {
		const view = new DataView(buffer.buffer);
		if (view.getUint32(0, true) !== CentralDirectoryFileHeaderSignature) {
			throw new SyntaxError(`Could not parse CentralDirectoryFileHeader, wrong signature.`);
		}
		const cdfh = new CentralDirectoryFileHeader();
		cdfh.versionMadeBy = view.getUint16(4, true);
		cdfh.versionNeededToExtract = view.getUint16(6, true);
		cdfh.generalPurposeBitFlag = view.getUint16(8, true);
		cdfh.compressionMethod = view.getUint16(10, true);
		cdfh.fileLastModificationDate = convertDosDateTimeToDate(view.getUint16(14, true), view.getUint16(12, true));
		cdfh.crcOfUncompressedData = view.getUint32(16, true);
		cdfh.compressedSize = view.getUint32(20, true);
		cdfh.uncompressedSize = view.getUint32(24, true);
		cdfh.fileNameLength = view.getUint16(28, true);
		cdfh.extraFieldLength = view.getUint16(30, true);
		cdfh.fileCommentLength = view.getUint16(32, true);
		cdfh.diskNumberWhereFileStarts = view.getUint16(34, true);
		cdfh.internalFileAttributes = view.getUint16(36, true);
		cdfh.externalFileAttributes = view.getUint32(38, true);
		cdfh.relativeOffsetOfLocalFileHeader = view.getUint32(42, true);
		return cdfh;
	}

	parseVariableBuffer(buffer: Uint8Array): void {
		const fileNameBytes = buffer.slice(0, this.fileNameLength);
		this.fileName = textDecoder.decode(fileNameBytes);
		this.extraField = buffer.slice(this.fileNameLength, this.fileNameLength + this.extraFieldLength);
		const fileCommentBytes = buffer.slice(this.fileNameLength + this.extraFieldLength, this.fileNameLength + this.extraFieldLength + this.fileCommentLength);
		this.fileComment = textDecoder.decode(fileCommentBytes);
	}

	toBuffer(): Uint8Array {
		const fileNameBytes = textEncoder.encode(this.fileName);
		this.fileNameLength = fileNameBytes.byteLength;
		this.extraFieldLength = this.extraField.byteLength;
		const fileCommentBytes = textEncoder.encode(this.fileComment);
		this.fileCommentLength = fileCommentBytes.byteLength;
		const buffer = new Uint8Array(46 + this.fileNameLength + this.extraFieldLength + this.fileCommentLength);
		const view = new DataView(buffer.buffer);
		view.setUint32(0, CentralDirectoryFileHeaderSignature, true);
		view.setUint16(4, this.versionMadeBy, true);
		view.setUint16(6, this.versionNeededToExtract, true);
		view.setUint16(8, this.generalPurposeBitFlag, true);
		view.setUint16(10, this.compressionMethod, true);
		const [date, time] = convertDateToDosDateTime(this.fileLastModificationDate);
		view.setUint16(12, time, true);
		view.setUint16(14, date, true);
		view.setUint32(16, this.crcOfUncompressedData, true);
		view.setUint32(20, this.compressedSize, true);
		view.setUint32(24, this.uncompressedSize, true);
		view.setUint16(28, this.fileNameLength, true);
		view.setUint16(30, this.extraFieldLength, true);
		view.setUint16(32, this.fileCommentLength, true);
		view.setUint16(34, this.diskNumberWhereFileStarts, true);
		view.setUint16(36, this.internalFileAttributes, true);
		view.setUint32(48, this.externalFileAttributes, true);
		view.setUint32(42, this.relativeOffsetOfLocalFileHeader, true);
		buffer.set(fileNameBytes, 46);
		buffer.set(this.extraField, 46 + this.fileNameLength);
		buffer.set(fileCommentBytes, 46 + this.fileNameLength + this.extraFieldLength);
		return buffer;
	}
}

/**
 * Central directory file header
 * {@link https://en.wikipedia.org/wiki/ZIP_(file_format)#Local_file_header}
 */
export class LocalFileHeader {
	/**
	 * Version needed to extract
	 */
	versionNeededToExtract = 0;
	/**
	 * General purpose bit flag
	 */
	generalPurposeBitFlag = 0;
	/**
	 * Compression method
	 */
	compressionMethod = 0;
	/**
	 * File last modification date
	 */
	fileLastModificationDate = new Date();
	/**
	 * CRC-32 of uncompressed data
	 */
	crcOfUncompressedData = 0;
	/**
	 * Compressed size
	 */
	compressedSize = 0;
	/**
	 * Uncompressed size
	 */
	uncompressedSize = 0;
	/**
	 * File name length
	 */
	fileNameLength = 0;
	/**
	 * Extra field length
	 */
	extraFieldLength = 0;
	/**
	 * File name
	 */
	fileName = "";
	/**
	 * Extra field
	 */
	extraField = new Uint8Array(0);

	/**
	 * Parse buffer into LocalFileHeader
	 */
	static parse(buffer: Uint8Array): LocalFileHeader {
		const view = new DataView(buffer.buffer);
		if (view.getUint32(0, true) !== LocalFileHeaderSignature) {
			throw new SyntaxError(`Could not parse LocalFileHeader, wrong signature.`);
		}
		const lfh = new LocalFileHeader();
		lfh.versionNeededToExtract = view.getUint16(4, true);
		lfh.generalPurposeBitFlag = view.getUint16(6, true);
		lfh.compressionMethod = view.getUint16(8, true);
		lfh.fileLastModificationDate = convertDosDateTimeToDate(view.getUint16(12, true), view.getUint16(10, true));
		lfh.crcOfUncompressedData = view.getUint32(14, true);
		lfh.compressedSize = view.getUint32(18, true);
		lfh.uncompressedSize = view.getUint32(22, true);
		lfh.fileNameLength = view.getUint16(26, true);
		lfh.extraFieldLength = view.getUint16(28, true);
		return lfh;
	}

	parseVariableBuffer(buffer: Uint8Array): void {
		const fileNameBytes = buffer.slice(0, this.fileNameLength);
		this.fileName = textDecoder.decode(fileNameBytes);
		this.extraField = buffer.slice(this.fileNameLength, this.fileNameLength + this.extraFieldLength);
	}

	toBuffer(): Uint8Array {
		const fileNameBytes = textEncoder.encode(this.fileName);
		this.fileNameLength = fileNameBytes.byteLength;
		this.extraFieldLength = this.extraField.byteLength;
		const buffer = new Uint8Array(30 + this.fileNameLength + this.extraFieldLength);
		const view = new DataView(buffer.buffer);
		view.setUint32(0, LocalFileHeaderSignature, true);
		view.setUint16(4, this.versionNeededToExtract, true);
		view.setUint16(6, this.generalPurposeBitFlag, true);
		view.setUint16(8, this.compressionMethod, true);
		const [date, time] = convertDateToDosDateTime(this.fileLastModificationDate);
		view.setUint16(10, time, true);
		view.setUint16(12, date, true);
		view.setUint32(14, this.crcOfUncompressedData, true);
		view.setUint32(18, this.compressedSize, true);
		view.setUint32(22, this.uncompressedSize, true);
		view.setUint16(26, this.fileNameLength, true);
		view.setUint16(28, this.extraFieldLength, true);
		buffer.set(fileNameBytes, 30);
		buffer.set(this.extraField, 30 + this.fileNameLength);
		return buffer;
	}
}

export class DataDescriptor {
	/**
	 * CRC-32 of uncompressed data
	 */
	crcOfUncompressedData = 0;
	/**
	 * Compressed size
	 */
	compressedSize = 0;
	/**
	 * Uncompressed size
	 */
	uncompressedSize = 0;

	/**
	 * Parse buffer into DataDescriptor
	 */
	static parse(buffer: Uint8Array): DataDescriptor {
		const view = new DataView(buffer.buffer);
		if (view.getUint32(0, true) !== DataDescriptorSignature) {
			throw new SyntaxError(`Could not parse DataDescriptor, wrong signature.`);
		}
		const dd = new DataDescriptor();
		dd.crcOfUncompressedData = view.getUint32(4, true);
		dd.compressedSize = view.getUint32(8, true);
		dd.uncompressedSize = view.getUint32(12, true);
		return dd;
	}

	toBuffer(): Uint8Array {
		const buffer = new Uint8Array(16);
		const view = new DataView(buffer.buffer);
		view.setUint32(0, DataDescriptorSignature, true);
		view.setUint32(4, this.crcOfUncompressedData, true);
		view.setUint32(8, this.compressedSize, true);
		view.setUint32(12, this.uncompressedSize, true);
		return buffer;
	}
}

export class DataDescriptor64 extends DataDescriptor {
	/**
	 * Parse buffer into DataDescriptor64
	 */
	static parse(buffer: Uint8Array, hasCrc = true, hasSizes = true): DataDescriptor64 {
		const view = new DataView(buffer.buffer);
		let i = 0;
		if (view.getUint32(0, true) === DataDescriptorSignature) {
			i += 4;
		}
		const dd = new DataDescriptor64();
		if (hasCrc) {
			dd.crcOfUncompressedData = view.getUint32(i, true);
			i += 4;
		}
		if (hasSizes) {
			dd.compressedSize = Number(view.getBigUint64(i, true));
			dd.uncompressedSize = Number(view.getBigUint64(i + 8, true));
		}
		return dd;
	}

	toBuffer(hasCrc = true, hasSizes = true): Uint8Array {
		const buffer = new Uint8Array(4 + (hasCrc ? 4 : 0) + (hasSizes ? 16 : 0));
		const view = new DataView(buffer.buffer);
		view.setUint32(0, DataDescriptorSignature, true);
		let i = 4;
		if (hasCrc) {
			view.setUint32(i, this.crcOfUncompressedData, true);
			i += 4;
		}
		if (hasSizes) {
			view.setBigUint64(i, BigInt(this.compressedSize), true);
			view.setBigUint64(i + 8, BigInt(this.uncompressedSize), true);
		}
		return buffer;
	}
}

export class Zip64ExtendedInformationExtraField {
	/**
	 * Size of the extra field chunk (8, 16, 24 or 28)
	 */
	sizeOfExtraFieldChunk = 0;
	/**
	 * Original uncompressed file size
	 */
	originalUncompressedFileSize = 0;
	/**
	 * Size of compressed data
	 */
	sizeOfCompressedData = 0;
	/**
	 * Offset of local header record
	 */
	offsetOfLocalHeaderRecord = 0;
	/**
	 * Number of the disk on which this file starts
	 */
	diskNumberWhereLocalFileHeaderStarts = 0;

	/**
	 * Parse buffer into Zip64ExtendedInformationExtraField
	 */
	static parse(buffer: Uint8Array): Zip64ExtendedInformationExtraField {
		const view = new DataView(buffer.buffer);
		if (view.getUint16(0, true) !== Zip64ExtendedInformationExtraFieldSignature) {
			throw new SyntaxError(`Could not parse Zip64ExtendedInformationExtraField, wrong signature.`);
		}
		const eief = new Zip64ExtendedInformationExtraField();
		eief.sizeOfExtraFieldChunk = view.getUint16(2, true);
		if (eief.sizeOfExtraFieldChunk >= 8) {
			eief.originalUncompressedFileSize = Number(view.getBigUint64(4, true));
		}
		if (eief.sizeOfExtraFieldChunk >= 16) {
			eief.sizeOfCompressedData = Number(view.getBigUint64(12, true));
		}
		if (eief.sizeOfExtraFieldChunk >= 24) {
			eief.offsetOfLocalHeaderRecord = Number(view.getBigUint64(20, true));
		}
		if (eief.sizeOfExtraFieldChunk === 28) {
			eief.diskNumberWhereLocalFileHeaderStarts = view.getUint32(28, true);
		}
		return eief;
	}

	toBuffer(): Uint8Array {
		const buffer = new Uint8Array(4 + this.sizeOfExtraFieldChunk);
		const view = new DataView(buffer.buffer);
		view.setUint16(0, Zip64ExtendedInformationExtraFieldSignature, true);
		view.setUint16(2, this.sizeOfExtraFieldChunk, true);
		if (this.sizeOfExtraFieldChunk >= 8) {
			view.setBigUint64(4, BigInt(this.originalUncompressedFileSize), true);
		}
		if (this.sizeOfExtraFieldChunk >= 16) {
			view.setBigUint64(12, BigInt(this.sizeOfCompressedData), true);
		}
		if (this.sizeOfExtraFieldChunk >= 24) {
			view.setBigUint64(20, BigInt(this.offsetOfLocalHeaderRecord), true);
		}
		if (this.sizeOfExtraFieldChunk >= 28) {
			view.setUint32(28, this.diskNumberWhereLocalFileHeaderStarts, true);
		}
		return buffer;
	}
}

/**
 * Convert DOS datetime to Date
 * @param date The date part
 * @param time The time part
 * @returns A {@see Date}
 */
export function convertDosDateTimeToDate(date: number, time: number): Date {
	const hours = (time >> 11) & 0b11111;
	const minutes = (time >> 5) & 0b111111;
	const seconds = (time & 0b11111) << 1;
	const year = ((date >> 9) & 0b1111111) + 1980;
	const month = ((date >> 5) & 0b1111);
	const day = date & 0b11111;
	return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * Convert Date to DOS datetime
 * @param dateTime The {@see Date}
 * @returns The DOS date and time
 */
export function convertDateToDosDateTime(dateTime: Date): [number, number] {
	const time = ((dateTime.getHours() & 0b11111) << 11) | ((dateTime.getMinutes() & 0b111111) << 5) | ((dateTime.getSeconds() >> 1) & 0b11111);
	const date = (((dateTime.getFullYear() - 1980) & 0b1111111) << 9) | (((dateTime.getMonth() + 1) & 0b1111) << 5) | (dateTime.getDate() & 0b11111);
	return [date, time];
}

function equalsArrayBuffer(a: ArrayBuffer, b: ArrayBuffer) {
	if (a.byteLength !== b.byteLength) {
		return false;
	}
	const aArr = new Uint32Array(a);
	const bArr = new Uint32Array(b);
	for (let i = 0, l = aArr.byteLength; i < l; ++i) {
		if (aArr[i] !== bArr[i]) {
			return false;
		}
	}
	return true;
}
