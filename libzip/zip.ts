import { File, SeekFrom } from "./file/file.ts";

const textDecoder = new TextDecoder("utf-8");
//const textEncoder = new TextEncoder();

export class Zip {
	#file: File | undefined;
	#endOfCentralDirectoryRecord: EndOfCentralDirectoryRecord | undefined;
	#centralDirectoryFileHeaders: CentralDirectoryFileHeader[];
	constructor(file: File) {
		this.#file = file;
		this.#centralDirectoryFileHeaders = [];
	}

	async open() {
		if (this.#file) {
			const offsetEndOfCentralDirectoryRecord = await this.#findEndOfCentralDirectoryRecord();
			await this.#file.seek(offsetEndOfCentralDirectoryRecord, SeekFrom.End);
			const endOfCentralDirectoryRecordBytes = new Uint8Array(-offsetEndOfCentralDirectoryRecord);
			await this.#file.read(endOfCentralDirectoryRecordBytes);
			this.#endOfCentralDirectoryRecord = EndOfCentralDirectoryRecord.parse(endOfCentralDirectoryRecordBytes);

			await this.#file.seek(this.#endOfCentralDirectoryRecord.offsetOfStartOfCentralDirectory, SeekFrom.Start);
			const centralDirectoryBytes = new Uint8Array(this.#endOfCentralDirectoryRecord.sizeOfCentralDirectory);
			await this.#file.read(centralDirectoryBytes);

			for (let offset = 0; offset < this.#endOfCentralDirectoryRecord.sizeOfCentralDirectory;) {
				const centralDirectoryFileHeader = CentralDirectoryFileHeader.parse(centralDirectoryBytes.slice(offset));
				const variableBufferLength = centralDirectoryFileHeader.fileNameLength + centralDirectoryFileHeader.extraFieldLength + centralDirectoryFileHeader.fileCommentLength;
				const variableBufferBytes = centralDirectoryBytes.slice(offset + 46, offset + 46 + variableBufferLength);
				centralDirectoryFileHeader.parseVariableBuffer(variableBufferBytes);
				offset += 46 + variableBufferLength;
				this.#centralDirectoryFileHeaders.push(centralDirectoryFileHeader);
			}
		}
	}

	// deno-lint-ignore require-await
	async close() {
		this.#file = undefined;
		this.#endOfCentralDirectoryRecord = undefined;
		this.#centralDirectoryFileHeaders = [];
	}

	*iterCentralDirectoryFileHeaders(): IterableIterator<Readonly<CentralDirectoryFileHeader>> {
		for (const centralDirectoryFileHeader of this.#centralDirectoryFileHeaders) {
			yield centralDirectoryFileHeader;
		}
	}

	async getLocalFileHeader(fileName: string, abortSignal?: AbortSignal): Promise<LocalFileHeader> {
		if (this.#file) {
			for (const fileHeader of this.iterCentralDirectoryFileHeaders()) {
				abortSignal?.throwIfAborted();
				if (fileHeader.fileName === fileName) {
					await this.#file.seek(fileHeader.relativeOffsetOfLocalFileHeader, SeekFrom.Start);
					abortSignal?.throwIfAborted();
					const localFileHeaderBytes = new Uint8Array(30);
					await this.#file.read(localFileHeaderBytes);
					abortSignal?.throwIfAborted();
					const localFileHeader = LocalFileHeader.parse(localFileHeaderBytes);
					const variableBufferLength = localFileHeader.fileNameLength + localFileHeader.extraFieldLength;
					const variableBufferBytes = new Uint8Array(variableBufferLength);
					await this.#file.read(variableBufferBytes);
					abortSignal?.throwIfAborted();
					localFileHeader.parseVariableBuffer(variableBufferBytes);
					return localFileHeader;
				}
			}
		}
		throw new FileNameNotExistsError(fileName);
	}

	async getReadableStream(fileName: string, abortSignal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
		if (this.#file) {
			const localFileHeader = await this.getLocalFileHeader(fileName, abortSignal);
			abortSignal?.throwIfAborted();
			let offset = 0;
			const compressedStream = new ReadableStream({
				pull: async (controller) => {
					if (
						abortSignal?.aborted ||
						!this.#file ||
						offset >= localFileHeader.compressedSize
					) {
						controller.close();
						return;
					}
					const chunkSize = Math.min(controller.desiredSize ?? 4 * 1024, localFileHeader.compressedSize - offset);
					const buffer = new Uint8Array(chunkSize);
					const byteRead = await this.#file.read(buffer);
					if (byteRead === null) {
						controller.close();
						return;
					}
					controller.enqueue(buffer);
					offset += byteRead;
				},
			});
			if (localFileHeader.compressionMethod === 0) {
				return compressedStream;
			} else if (localFileHeader.compressionMethod === 8) {
				return compressedStream.pipeThrough(new DecompressionStream("deflate-raw"));
			}
			throw new CompressionMethodNotSupportedError(localFileHeader.compressionMethod);
		}
		throw new FileNameNotExistsError(fileName);
	}

	async #findEndOfCentralDirectoryRecord(): Promise<number> {
		if (this.#file) {
			const buffer = new Uint8Array(4);
			const view = new DataView(buffer.buffer);
			for (let offset = 22; offset < 0xFFFF; ++offset) {
				await this.#file.seek(-offset, SeekFrom.End);
				const byteRead = await this.#file.read(buffer);
				if (byteRead === null) {
					break;
				}
				if (byteRead < 4) {
					break;
				}
				if (view.getUint32(0, true) === EndOfCentralDirectoryRecordSignature) {
					return -offset;
				}
			}
		}
		throw new SyntaxError(`Could not find EndOfCentralDirectoryRecord.`);
	}
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
const CentralDirectoryFileHeaderSignature = 0x02014b50;
const LocalFileHeaderSignature = 0x04034b50;

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
		const sizeOfComment = view.getUint16(20, true);
		const commentBytes = buffer.slice(22, 22 + sizeOfComment);
		eocdr.comment = textDecoder.decode(commentBytes);
		return eocdr;
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
	 * File last modification time
	 */
	fileLastModificationTime = 0;
	/**
	 * File last modification date
	 */
	fileLastModificationDate = 0;
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
		cdfh.fileLastModificationTime = view.getUint16(12, true);
		cdfh.fileLastModificationDate = view.getUint16(14, true);
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
	 * File last modification time
	 */
	fileLastModificationTime = 0;
	/**
	 * File last modification date
	 */
	fileLastModificationDate = 0;
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
		lfh.fileLastModificationTime = view.getUint16(10, true);
		lfh.fileLastModificationDate = view.getUint16(12, true);
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
}
