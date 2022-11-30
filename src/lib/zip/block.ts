const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export class EndOfCentralDirectoryRecord {
	static SIGNATURE = 0x06054B50;
	#arrayBuffer: Uint8Array;
	#dataView: DataView;
	constructor(length = 22) {
		this.#arrayBuffer = new Uint8Array(length);
		this.#dataView = new DataView(this.#arrayBuffer.buffer);
		this.#dataView.setUint32(0, EndOfCentralDirectoryRecord.SIGNATURE, true);
	}
	throwIfSignatureMismatch() {
		const sig = this.#dataView.getUint32(0, true);
		if (sig !== EndOfCentralDirectoryRecord.SIGNATURE) {
			throw new SyntaxError(
				`Wrong signature for EndOfCentralDirectoryRecord, got ${sig.toString(16)}.`,
			);
		}
	}
	get arrayBuffer() {
		return this.#arrayBuffer;
	}
	get numberOfThisDisk() {
		return this.#dataView.getUint16(4, true);
	}
	set numberOfThisDisk(value: number) {
		this.#dataView.setUint16(4, value, true);
	}
	get centralDirectoryDiskNumber() {
		return this.#dataView.getUint16(6, true);
	}
	set centralDirectoryDiskNumber(value: number) {
		this.#dataView.setUint16(6, value, true);
	}
	get entriesInThisDisk() {
		return this.#dataView.getUint16(8, true);
	}
	set entriesInThisDisk(value: number) {
		this.#dataView.setUint16(8, value, true);
	}
	get totalEntries() {
		return this.#dataView.getUint16(10, true);
	}
	set totalEntries(value: number) {
		this.#dataView.setUint16(10, value, true);
	}
	get sizeOfCentralDirectory() {
		return this.#dataView.getUint32(12, true);
	}
	set sizeOfCentralDirectory(value: number) {
		this.#dataView.setUint32(12, value, true);
	}
	get offsetToCentralDirectory() {
		return this.#dataView.getUint32(16, true);
	}
	set offsetToCentralDirectory(value: number) {
		this.#dataView.setUint32(16, value, true);
	}
	get commentLength() {
		return this.#dataView.getUint16(20, true);
	}
	get comment() {
		return textDecoder.decode(
			this.#arrayBuffer.slice(22, 22 + this.commentLength),
		);
	}
	set comment(value: string) {
		const data = textEncoder.encode(value);
		if (data.byteLength === this.commentLength) {
			this.#arrayBuffer.set(data, 22);
		} else {
			const arrayBuffer = new Uint8Array(22 + data.byteLength);
			const dataView = new DataView(arrayBuffer.buffer);
			arrayBuffer.set(this.#arrayBuffer, 0);
			dataView.setUint16(20, data.byteLength, true);
			arrayBuffer.set(data, 22);
			this.#arrayBuffer = arrayBuffer;
			this.#dataView = dataView;
		}
	}
	toJSON() {
		return {
			numberOfThisDisk: this.numberOfThisDisk,
			centralDirectoryDiskNumber: this.centralDirectoryDiskNumber,
			entriesInThisDisk: this.entriesInThisDisk,
			totalEntries: this.totalEntries,
			sizeOfCentralDirectory: this.sizeOfCentralDirectory,
			offsetToCentralDirectory: this.offsetToCentralDirectory,
			commentLength: this.commentLength,
			comment: this.comment,
		};
	}
}

export class Zip64EndOfCentralDirectoryLocator {
	static SIGNATURE = 0x07064B50;
	#arrayBuffer: Uint8Array;
	#dataView: DataView;
	constructor(length = 20) {
		this.#arrayBuffer = new Uint8Array(length);
		this.#dataView = new DataView(this.#arrayBuffer.buffer);
		this.#dataView.setUint32(
			0,
			Zip64EndOfCentralDirectoryLocator.SIGNATURE,
			true,
		);
	}
	throwIfSignatureMismatch() {
		const sig = this.#dataView.getUint32(0, true);
		if (sig !== Zip64EndOfCentralDirectoryLocator.SIGNATURE) {
			throw new SyntaxError(
				`Wrong signature for Zip64EndOfCentralDirectoryLocator, got ${sig.toString(16)}.`,
			);
		}
	}
	get arrayBuffer() {
		return this.#arrayBuffer;
	}
	get centralDirectoryDiskNumber() {
		return this.#dataView.getUint32(4, true);
	}
	set centralDirectoryDiskNumber(value: number) {
		this.#dataView.setUint32(4, value, true);
	}
	get offsetToCentralDirectory() {
		return Number(this.#dataView.getBigUint64(8, true));
	}
	set offsetToCentralDirectory(value: number) {
		this.#dataView.setBigUint64(8, BigInt(value), true);
	}
	get totalNumberOfDisk() {
		return Number(this.#dataView.getUint32(16, true));
	}
	set totalNumberOfDisk(value: number) {
		this.#dataView.setUint32(16, value, true);
	}
	toJSON() {
		return {
			centralDirectoryDiskNumber: this.centralDirectoryDiskNumber,
			offsetToCentralDirectory: this.offsetToCentralDirectory,
			totalNumberOfDisk: this.totalNumberOfDisk,
		};
	}
}

export class Zip64EndOfCentralDirectoryRecord {
	static SIGNATURE = 0x06064B50;
	#arrayBuffer: Uint8Array;
	#dataView: DataView;
	constructor(length = 56) {
		this.#arrayBuffer = new Uint8Array(length);
		this.#dataView = new DataView(this.#arrayBuffer.buffer);
		this.#dataView.setUint32(
			0,
			Zip64EndOfCentralDirectoryRecord.SIGNATURE,
			true,
		);
		this.#dataView.setBigUint64(4, BigInt(56 - 12), true);
	}
	throwIfSignatureMismatch() {
		const sig = this.#dataView.getUint32(0, true);
		if (sig !== Zip64EndOfCentralDirectoryRecord.SIGNATURE) {
			throw new SyntaxError(
				`Wrong signature for Zip64EndOfCentralDirectoryRecord, got ${sig.toString(16)}.`,
			);
		}
	}
	get arrayBuffer() {
		return this.#arrayBuffer;
	}
	get sizeOfRecord() {
		return this.#arrayBuffer.byteLength - 12;
	}
	get createdZipSpec() {
		return this.#dataView.getUint8(12);
	}
	set createdZipSpec(value: number) {
		this.#dataView.setUint8(12, value);
	}
	get createdOS() {
		return this.#dataView.getUint8(13);
	}
	set createdOS(value: number) {
		this.#dataView.setUint8(13, value);
	}
	get extractedZipSpec() {
		return this.#dataView.getUint8(14);
	}
	set extractedZipSpec(value: number) {
		this.#dataView.setUint8(14, value);
	}
	get extractedOS() {
		return this.#dataView.getUint8(15);
	}
	set extractedOS(value: number) {
		this.#dataView.setUint8(15, value);
	}
	get numberOfThisDisk() {
		return this.#dataView.getUint32(16, true);
	}
	set numberOfThisDisk(value: number) {
		this.#dataView.setUint32(16, value, true);
	}
	get centralDirectoryDiskNumber() {
		return this.#dataView.getUint32(20, true);
	}
	set centralDirectoryDiskNumber(value: number) {
		this.#dataView.setUint32(20, value, true);
	}
	get entriesInThisDisk() {
		return Number(this.#dataView.getBigUint64(24, true));
	}
	set entriesInThisDisk(value: number) {
		this.#dataView.setBigUint64(24, BigInt(value), true);
	}
	get totalEntries() {
		return Number(this.#dataView.getBigUint64(32, true));
	}
	set totalEntries(value: number) {
		this.#dataView.setBigUint64(32, BigInt(value), true);
	}
	get sizeOfCentralDirectory() {
		return Number(this.#dataView.getBigUint64(40, true));
	}
	set sizeOfCentralDirectory(value: number) {
		this.#dataView.setBigUint64(40, BigInt(value), true);
	}
	get offsetToCentralDirectory() {
		return Number(this.#dataView.getBigUint64(48, true));
	}
	set offsetToCentralDirectory(value: number) {
		this.#dataView.setBigUint64(48, BigInt(value), true);
	}
	get commentLength() {
		return this.sizeOfRecord - (56 - 12);
	}
	get comment() {
		return textDecoder.decode(
			this.#arrayBuffer.slice(56, 56 + this.commentLength),
		);
	}
	set comment(value: string) {
		const data = textEncoder.encode(value);
		if (data.byteLength === this.commentLength) {
			this.#arrayBuffer.set(data, 56);
		} else {
			const arrayBuffer = new Uint8Array(56 + data.byteLength);
			const dataView = new DataView(arrayBuffer.buffer);
			arrayBuffer.set(this.#arrayBuffer, 0);
			dataView.setBigUint64(4, BigInt(56 + data.byteLength - 12), true);
			arrayBuffer.set(data, 56);
			this.#arrayBuffer = arrayBuffer;
			this.#dataView = dataView;
		}
	}
	toJSON() {
		return {
			sizeOfRecord: this.sizeOfRecord,
			createdZipSpec: this.createdZipSpec,
			createdOS: this.createdOS,
			extractedZipSpec: this.extractedZipSpec,
			extractedOS: this.extractedOS,
			numberOfThisDisk: this.numberOfThisDisk,
			centralDirectoryDiskNumber: this.centralDirectoryDiskNumber,
			entriesInThisDisk: this.entriesInThisDisk,
			totalEntries: this.totalEntries,
			sizeOfCentralDirectory: this.sizeOfCentralDirectory,
			offsetToCentralDirectory: this.offsetToCentralDirectory,
			commentLength: this.commentLength,
			comment: this.comment,
		};
	}
}

export class CentralDirectoryFileHeader {
	static SIGNATURE = 0x02014B50;
	#arrayBuffer: Uint8Array;
	#dataView: DataView;
	isUpdated = false;
	isDeleted = false;
	centralDirectoryFileHeaderOffset = 0;
	constructor(length = 46) {
		this.#arrayBuffer = new Uint8Array(length);
		this.#dataView = new DataView(this.#arrayBuffer.buffer);
		this.#dataView.setUint32(0, CentralDirectoryFileHeader.SIGNATURE, true);
	}
	throwIfSignatureMismatch() {
		const sig = this.#dataView.getUint32(0, true);
		if (sig !== CentralDirectoryFileHeader.SIGNATURE) {
			throw new SyntaxError(
				`Wrong signature for CentralDirectoryFileHeader, got ${sig.toString(16)}.`,
			);
		}
	}
	get arrayBuffer() {
		return this.#arrayBuffer;
	}
	get createdZipSpec() {
		return this.#dataView.getUint8(4);
	}
	set createdZipSpec(value: number) {
		this.#dataView.setUint8(4, value);
	}
	get createdOS() {
		return this.#dataView.getUint8(5);
	}
	set createdOS(value: number) {
		this.#dataView.setUint8(5, value);
	}
	get extractedZipSpec() {
		return this.#dataView.getUint8(6);
	}
	set extractedZipSpec(value: number) {
		this.#dataView.setUint8(6, value);
	}
	get extractedOS() {
		return this.#dataView.getUint8(7);
	}
	set extractedOS(value: number) {
		this.#dataView.setUint8(7, value);
	}
	get generalPurposeFlag() {
		return this.#dataView.getUint16(8, true);
	}
	set generalPurposeFlag(value: number) {
		this.#dataView.setUint16(8, value, true);
	}
	get compressionMethod() {
		return this.#dataView.getUint16(10, true);
	}
	set compressionMethod(value: number) {
		this.#dataView.setUint16(10, value, true);
	}
	get lastModificationDate() {
		const time = this.#dataView.getUint16(12, true);
		const date = this.#dataView.getUint16(14, true);
		const hours = (time >> 11) & 0b11111;
		const minutes = (time >> 5) & 0b111111;
		const seconds = (time & 0b11111) << 1;
		const year = ((date >> 9) & 0b1111111) + 1980;
		const month = ((date >> 5) & 0b1111);
		const day = date & 0b11111;
		return new Date(year, month - 1, day, hours, minutes, seconds);
	}
	set lastModificationDate(value: Date) {
		const time = ((value.getHours() & 0b11111) << 11) |
			((value.getMinutes() & 0b111111) << 5) |
			((value.getSeconds() >> 1) & 0b11111);
		const date = (((value.getFullYear() - 1980) & 0b1111111) << 9) |
			(((value.getMonth() + 1) & 0b1111) << 5) | (value.getDate() & 0b11111);
		this.#dataView.setUint16(12, time, true);
		this.#dataView.setUint16(14, date, true);
	}
	get crc() {
		return this.#dataView.getUint32(16, true);
	}
	set crc(value: number) {
		this.#dataView.setUint32(16, value, true);
	}
	get compressedLength() {
		return this.#dataView.getUint32(20, true);
	}
	set compressedLength(value: number) {
		this.#dataView.setUint32(20, value, true);
	}
	get uncompressedLength() {
		return this.#dataView.getUint32(24, true);
	}
	set uncompressedLength(value: number) {
		this.#dataView.setUint32(24, value, true);
	}
	get fileNameLength() {
		return this.#dataView.getUint16(28, true);
	}
	get fileName() {
		return textDecoder.decode(
			this.#arrayBuffer.slice(46, 46 + this.fileNameLength),
		);
	}
	set fileName(value: string) {
		const data = textEncoder.encode(value);
		if (data.byteLength === this.fileNameLength) {
			this.#arrayBuffer.set(data, 46);
		} else {
			const arrayBuffer = new Uint8Array(
				46 + data.byteLength + this.extraLength + this.commentLength,
			);
			const dataView = new DataView(arrayBuffer.buffer);
			arrayBuffer.set(this.#arrayBuffer, 0);
			dataView.setUint16(28, data.byteLength, true);
			arrayBuffer.set(data, 46);
			arrayBuffer.set(this.extra, 46 + data.byteLength);
			const commentData = textEncoder.encode(this.comment);
			arrayBuffer.set(commentData, 46 + data.byteLength + this.extraLength);
			this.#arrayBuffer = arrayBuffer;
			this.#dataView = dataView;
		}
	}
	get extraLength() {
		return this.#dataView.getUint16(30, true);
	}
	get extra() {
		return this.#arrayBuffer.slice(
			46 + this.fileNameLength,
			46 + this.fileNameLength + this.extraLength,
		);
	}
	set extra(value: Uint8Array) {
		if (value.byteLength === this.extraLength) {
			this.#arrayBuffer.set(value, 46 + this.fileNameLength);
		} else {
			const arrayBuffer = new Uint8Array(
				46 + this.fileNameLength + value.byteLength + this.commentLength,
			);
			const dataView = new DataView(arrayBuffer.buffer);
			arrayBuffer.set(this.#arrayBuffer.slice(0, 46 + this.fileNameLength), 0);
			dataView.setUint16(30, value.byteLength, true);
			arrayBuffer.set(value, 46 + this.fileNameLength);
			const commentData = textEncoder.encode(this.comment);
			arrayBuffer.set(commentData, 46 + this.fileNameLength + value.byteLength);
			this.#arrayBuffer = arrayBuffer;
			this.#dataView = dataView;
		}
	}
	get extensibleDataFields() {
		return new ExtensibleDataFields(this.extra);
	}
	set extensibleDataFields(value: ExtensibleDataFields) {
		this.extra = value.arrayBuffer;
	}
	getZip64ExtensibleDataField() {
		const extensibleDataFields = this.extensibleDataFields;
		for (const edf of extensibleDataFields) {
			if (edf instanceof Zip64ExtensibleDataField) {
				return edf;
			}
		}
	}
	get commentLength() {
		return this.#dataView.getUint16(32, true);
	}
	get comment() {
		return textDecoder.decode(
			this.#arrayBuffer.slice(
				46 + this.fileNameLength + this.extraLength,
				46 + this.fileNameLength + this.extraLength + this.commentLength,
			),
		);
	}
	set comment(value: string) {
		const data = textEncoder.encode(value);
		if (data.byteLength === this.commentLength) {
			this.#arrayBuffer.set(data, 46 + this.fileNameLength + this.extraLength);
		} else {
			const arrayBuffer = new Uint8Array(
				46 + this.fileNameLength + this.extraLength + data.byteLength,
			);
			const dataView = new DataView(arrayBuffer.buffer);
			arrayBuffer.set(this.#arrayBuffer.slice(0, 46 + this.fileNameLength), 0);
			dataView.setUint16(32, data.byteLength, true);
			arrayBuffer.set(data, 46 + this.fileNameLength + this.extraLength);
			this.#arrayBuffer = arrayBuffer;
			this.#dataView = dataView;
		}
	}
	get diskStart() {
		return this.#dataView.getUint16(34, true);
	}
	set diskStart(value: number) {
		this.#dataView.setUint16(34, value, true);
	}
	get internalFileAttribute() {
		return this.#dataView.getUint16(36, true);
	}
	set internalFileAttribute(value: number) {
		this.#dataView.setUint16(36, value, true);
	}
	get externalFileAttribute() {
		return this.#dataView.getUint32(38, true);
	}
	set externalFileAttribute(value: number) {
		this.#dataView.setUint32(38, value, true);
	}
	get localFileOffset() {
		return this.#dataView.getUint32(42, true);
	}
	set localFileOffset(value: number) {
		this.#dataView.setUint32(42, value, true);
	}
	toJSON() {
		return {
			createdZipSpec: this.createdZipSpec,
			createdOS: this.createdOS,
			extractedZipSpec: this.extractedZipSpec,
			extractedOS: this.extractedOS,
			generalPurposeFlag: this.generalPurposeFlag,
			compressionMethod: this.compressionMethod,
			lastModificationDate: this.lastModificationDate,
			crc: this.crc,
			compressedLength: this.compressedLength,
			uncompressedLength: this.uncompressedLength,
			fileNameLength: this.fileNameLength,
			fileName: this.fileName,
			extraLength: this.extraLength,
			extra: this.extra,
			commentLength: this.commentLength,
			comment: this.comment,
			diskStart: this.diskStart,
			internalFileAttribute: this.internalFileAttribute,
			externalFileAttribute: this.externalFileAttribute,
			localFileOffset: this.localFileOffset,
		};
	}
}

export class LocalFileHeader {
	static SIGNATURE = 0x04034b50;
	#arrayBuffer: Uint8Array;
	#dataView: DataView;
	constructor(length = 30) {
		this.#arrayBuffer = new Uint8Array(length);
		this.#dataView = new DataView(this.#arrayBuffer.buffer);
		this.#dataView.setUint32(0, LocalFileHeader.SIGNATURE, true);
	}
	throwIfSignatureMismatch() {
		const sig = this.#dataView.getUint32(0, true);
		if (sig !== LocalFileHeader.SIGNATURE) {
			throw new SyntaxError(
				`Wrong signature for LocalFileHeader, got ${sig.toString(16)}.`,
			);
		}
	}
	get arrayBuffer() {
		return this.#arrayBuffer;
	}
	get extractedZipSpec() {
		return this.#dataView.getUint8(4);
	}
	set extractedZipSpec(value: number) {
		this.#dataView.setUint8(4, value);
	}
	get extractedOS() {
		return this.#dataView.getUint8(5);
	}
	set extractedOS(value: number) {
		this.#dataView.setUint8(5, value);
	}
	get generalPurposeFlag() {
		return this.#dataView.getUint16(6, true);
	}
	set generalPurposeFlag(value: number) {
		this.#dataView.setUint16(6, value, true);
	}
	get compressionMethod() {
		return this.#dataView.getUint16(8, true);
	}
	set compressionMethod(value: number) {
		this.#dataView.setUint16(8, value, true);
	}
	get lastModificationDate() {
		const time = this.#dataView.getUint16(10, true);
		const date = this.#dataView.getUint16(12, true);
		const hours = (time >> 11) & 0b11111;
		const minutes = (time >> 5) & 0b111111;
		const seconds = (time & 0b11111) << 1;
		const year = ((date >> 9) & 0b1111111) + 1980;
		const month = ((date >> 5) & 0b1111);
		const day = date & 0b11111;
		return new Date(year, month - 1, day, hours, minutes, seconds);
	}
	set lastModificationDate(value: Date) {
		const time = ((value.getHours() & 0b11111) << 11) |
			((value.getMinutes() & 0b111111) << 5) |
			((value.getSeconds() >> 1) & 0b11111);
		const date = (((value.getFullYear() - 1980) & 0b1111111) << 9) |
			(((value.getMonth() + 1) & 0b1111) << 5) | (value.getDate() & 0b11111);
		this.#dataView.setUint16(10, time, true);
		this.#dataView.setUint16(12, date, true);
	}
	get crc() {
		return this.#dataView.getUint32(14, true);
	}
	set crc(value: number) {
		this.#dataView.setUint32(14, value, true);
	}
	get compressedLength() {
		return this.#dataView.getUint32(18, true);
	}
	set compressedLength(value: number) {
		this.#dataView.setUint32(18, value, true);
	}
	get uncompressedLength() {
		return this.#dataView.getUint32(22, true);
	}
	set uncompressedLength(value: number) {
		this.#dataView.setUint32(22, value, true);
	}
	get fileNameLength() {
		return this.#dataView.getUint16(26, true);
	}
	get fileName() {
		return textDecoder.decode(
			this.#arrayBuffer.slice(30, 30 + this.fileNameLength),
		);
	}
	set fileName(value: string) {
		const data = textEncoder.encode(value);
		if (data.byteLength === this.fileNameLength) {
			this.#arrayBuffer.set(data, 30);
		} else {
			const arrayBuffer = new Uint8Array(
				30 + data.byteLength + this.extraLength,
			);
			const dataView = new DataView(arrayBuffer.buffer);
			arrayBuffer.set(this.#arrayBuffer.slice(0, 30), 0);
			dataView.setUint16(26, data.byteLength, true);
			arrayBuffer.set(data, 30);
			arrayBuffer.set(this.extra, 30 + data.byteLength);
			this.#arrayBuffer = arrayBuffer;
			this.#dataView = dataView;
		}
	}
	get extraLength() {
		return this.#dataView.getUint16(28, true);
	}
	get extra() {
		return new Uint8Array(
			this.#arrayBuffer.slice(
				30 + this.fileNameLength,
				30 + this.fileNameLength + this.extraLength,
			),
		);
	}
	set extra(value: Uint8Array) {
		if (value.byteLength === this.extraLength) {
			this.#arrayBuffer.set(value, 30 + this.fileNameLength);
		} else {
			const arrayBuffer = new Uint8Array(
				30 + this.fileNameLength + value.byteLength,
			);
			const dataView = new DataView(arrayBuffer.buffer);
			arrayBuffer.set(this.#arrayBuffer.slice(0, 30 + this.fileNameLength), 0);
			dataView.setUint16(28, value.byteLength, true);
			arrayBuffer.set(this.extra, 30 + this.fileNameLength);
			this.#arrayBuffer = arrayBuffer;
			this.#dataView = dataView;
		}
	}
	get extensibleDataFields() {
		return new ExtensibleDataFields(this.extra);
	}
	set extensibleDataFields(value: ExtensibleDataFields) {
		this.extra = value.arrayBuffer;
	}
	getZip64ExtensibleDataField() {
		const extensibleDataFields = this.extensibleDataFields;
		for (const edf of extensibleDataFields) {
			if (edf instanceof Zip64ExtensibleDataField) {
				return edf;
			}
		}
	}
	getCompressedLength(cdfh: Readonly<CentralDirectoryFileHeader>) {
		const compressedSize = this.generalPurposeFlag & 0b100 ? this.compressedLength : cdfh.compressedLength;
		if (compressedSize === 0xFFFFFFFF) {
			const z64ei = this.generalPurposeFlag & 0b100 ? this.getZip64ExtensibleDataField() : cdfh.getZip64ExtensibleDataField();
			if (z64ei && z64ei.sizeOfCompressedData !== null) {
				return z64ei.sizeOfCompressedData;
			}
		}
		return compressedSize;
	}
	toJSON() {
		return {
			extractedZipSpec: this.extractedZipSpec,
			extractedOS: this.extractedOS,
			generalPurposeFlag: this.generalPurposeFlag,
			compressionMethod: this.compressionMethod,
			lastModificationDate: this.lastModificationDate,
			crc: this.crc,
			compressedLength: this.compressedLength,
			uncompressedLength: this.uncompressedLength,
			fileNameLength: this.fileNameLength,
			fileName: this.fileName,
			extraLength: this.extraLength,
			extra: this.extra,
		};
	}
}

export class ExtensibleDataFields {
	#arrayBuffer: Uint8Array;
	#dataView: DataView;
	constructor(arrayBuffer_or_length: Uint8Array | number) {
		this.#arrayBuffer = arrayBuffer_or_length instanceof Uint8Array ? arrayBuffer_or_length : new Uint8Array(4 + arrayBuffer_or_length);
		this.#dataView = new DataView(this.#arrayBuffer.buffer);
	}
	get arrayBuffer() {
		return this.#arrayBuffer;
	}
	*[Symbol.iterator](): IterableIterator<ExtensibleDataField> {
		for (let i = 0, l = this.arrayBuffer.length; i < l;) {
			const headerId = this.#dataView.getUint16(i, true);
			const length = this.#dataView.getUint16(i + 2, true);
			const data = this.#arrayBuffer.slice(i, i + 4 + length);
			i += i + 4 + length;
			if (headerId === Zip64ExtensibleDataField.SIGNATURE) {
				yield new Zip64ExtensibleDataField(data);
			} else {
				yield new ExtensibleDataField(data);
			}
		}
	}
	addExtensibleDataField(extensibleDataField: ExtensibleDataField) {
		let length = 0;
		for (const df of this) {
			if (df.headerId !== extensibleDataField.headerId) {
				length += df.arrayBuffer.byteLength;
			}
		}
		const arrayBuffer = new Uint8Array(
			length + extensibleDataField.arrayBuffer.byteLength,
		);
		let offset = 0;
		for (const df of this) {
			if (df.headerId !== extensibleDataField.headerId) {
				arrayBuffer.set(df.arrayBuffer, offset);
				offset += arrayBuffer.byteLength;
			}
		}
		arrayBuffer.set(extensibleDataField.arrayBuffer, offset);
		this.#arrayBuffer = arrayBuffer;
		this.#dataView = new DataView(this.#arrayBuffer.buffer);
	}
}

export class ExtensibleDataField {
	#arrayBuffer: Uint8Array;
	#dataView: DataView;
	constructor(arrayBuffer_or_length: Uint8Array | number) {
		this.#arrayBuffer = arrayBuffer_or_length instanceof Uint8Array ? arrayBuffer_or_length : new Uint8Array(4 + arrayBuffer_or_length);
		this.#dataView = new DataView(this.arrayBuffer.buffer);
	}
	get arrayBuffer() {
		return this.#arrayBuffer;
	}
	protected get dataView() {
		return this.#dataView;
	}
	get headerId() {
		return this.dataView.getUint16(0, true);
	}
	set headerId(value: number) {
		this.dataView.setUint16(0, value, true);
	}
	get length() {
		return this.dataView.getUint16(2, true);
	}
	set length(value: number) {
		this.dataView.setUint16(2, value, true);
		const arrayBuffer = new Uint8Array(4 + value);
		arrayBuffer.set(this.arrayBuffer, 0);
	}
}

export class Zip64ExtensibleDataField extends ExtensibleDataField {
	static SIGNATURE = 0b0001;
	constructor(arrayBuffer: Uint8Array);
	constructor(length: number);
	constructor(arrayBuffer_or_length: Uint8Array | number) {
		super(arrayBuffer_or_length);
		this.dataView.setUint16(0, 0b0001, true);
		this.dataView.setUint16(2, this.arrayBuffer.length - 4, true);
	}

	get originalUncompressedData() {
		if (this.length >= 8) {
			return Number(this.dataView.getBigUint64(4, true));
		}
		return null;
	}
	set originalUncompressedData(value: number | null) {
		if (value !== null && this.length >= 8) {
			this.dataView.setBigUint64(4, BigInt(value), true);
		}
	}
	get sizeOfCompressedData() {
		if (this.length >= 16) {
			return Number(this.dataView.getBigUint64(12, true));
		}
		return null;
	}
	set sizeOfCompressedData(value: number | null) {
		if (value !== null && this.length >= 16) {
			this.dataView.setBigUint64(12, BigInt(value), true);
		}
	}
	get offsetOfLocalHeaderRecord() {
		if (this.length >= 24) {
			return Number(this.dataView.getBigUint64(20, true));
		}
		return null;
	}
	set offsetOfLocalHeaderRecord(value: number | null) {
		if (value !== null && this.length >= 24) {
			this.dataView.setBigUint64(20, BigInt(value), true);
		}
	}
	get localHeaderDiskNumber() {
		if (this.length >= 28) {
			return this.dataView.getUint32(28, true);
		}
		return null;
	}
	set localHeaderDiskNumber(value: number | null) {
		if (value !== null && this.length >= 28) {
			this.dataView.setUint32(28, value, true);
		}
	}
	toJSON() {
		return {
			length: this.length,
			originalUncompressedData: this.originalUncompressedData,
			sizeOfCompressedData: this.sizeOfCompressedData,
			offsetOfLocalHeaderRecord: this.offsetOfLocalHeaderRecord,
			localHeaderDiskNumber: this.localHeaderDiskNumber,
		};
	}
}

export class DataDescriptor {
	static SIGNATURE = 0x08074b50;
	#arrayBuffer: Uint8Array;
	#dataView: DataView;
	constructor() {
		this.#arrayBuffer = new Uint8Array(16);
		this.#dataView = new DataView(this.#arrayBuffer.buffer);
		this.#dataView.setUint32(0, DataDescriptor.SIGNATURE, true);
	}
	get arrayBuffer() {
		return this.#arrayBuffer;
	}
	get crc() {
		return this.#dataView.getUint32(4, true);
	}
	set crc(value: number) {
		this.#dataView.setUint32(4, value, true);
	}
	get compressedLength() {
		return this.#dataView.getUint32(8, true);
	}
	set compressedLength(value: number) {
		this.#dataView.setUint32(8, value, true);
	}
	get uncompressedLength() {
		return this.#dataView.getUint32(12, true);
	}
	set uncompressedLength(value: number) {
		this.#dataView.setUint32(12, value, true);
	}
	toJSON() {
		return {
			crc: this.crc,
			compressedLength: this.compressedLength,
			uncompressedLength: this.uncompressedLength,
		};
	}
}

export class Zip64DataDescriptor {
	static SIGNATURE = 0x08074b50;
	#arrayBuffer: Uint8Array;
	#dataView: DataView;
	constructor() {
		this.#arrayBuffer = new Uint8Array(24);
		this.#dataView = new DataView(this.#arrayBuffer.buffer);
		this.#dataView.setUint32(0, Zip64DataDescriptor.SIGNATURE, true);
	}
	get arrayBuffer() {
		return this.#arrayBuffer;
	}
	get crc() {
		return this.#dataView.getUint32(4, true);
	}
	set crc(value: number) {
		this.#dataView.setUint32(4, value, true);
	}
	get compressedLength() {
		return Number(this.#dataView.getBigUint64(8, true));
	}
	set compressedLength(value: number) {
		this.#dataView.setBigUint64(8, BigInt(value), true);
	}
	get uncompressedLength() {
		return Number(this.#dataView.getBigUint64(16, true));
	}
	set uncompressedLength(value: number) {
		this.#dataView.setBigUint64(16, BigInt(value), true);
	}
	toJSON() {
		return {
			crc: this.crc,
			compressedLength: this.compressedLength,
			uncompressedLength: this.uncompressedLength,
		};
	}
}

export class PxlrHeader {
	static SIGNATURE = 0x50584B50;
	#arrayBuffer: Uint8Array;
	#dataView: DataView;
	constructor() {
		this.#arrayBuffer = new Uint8Array(8);
		this.#dataView = new DataView(this.#arrayBuffer.buffer);
		this.#dataView.setUint32(0, PxlrHeader.SIGNATURE, true);
	}
	throwIfSignatureMismatch() {
		const sig = this.#dataView.getUint32(0, true);
		if (sig !== PxlrHeader.SIGNATURE) {
			throw new SyntaxError(
				`Wrong signature for PxlrHeader, got ${sig.toString(16)}.`,
			);
		}
	}
	get arrayBuffer() {
		return this.#arrayBuffer;
	}
	get sizeOfPadding() {
		return this.#dataView.getUint32(4, true);
	}
	set sizeOfPadding(value: number) {
		this.#dataView.setUint32(4, value, true);
	}
	toJSON() {
		return {
			sizeOfPadding: this.sizeOfPadding,
		};
	}
}
