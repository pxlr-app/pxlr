import { describe, expect, test } from '@jest/globals';
import {
	CentralDirectoryFileHeader,
	DataDescriptor,
	EndOfCentralDirectoryRecord,
	LocalFileHeader,
	Zip64DataDescriptor,
	Zip64EndOfCentralDirectoryLocator,
	Zip64EndOfCentralDirectoryRecord,
	Zip64ExtensibleDataField,
} from "./block";

describe("Block", () => {

	test("EndOfCentralDirectoryRecord", () => {
		const block1 = new EndOfCentralDirectoryRecord();
		expect(block1.arrayBuffer.byteLength).toEqual(22);
		expect(block1.commentLength).toEqual(0);
		expect(block1.comment).toEqual("");

		const block2 = new EndOfCentralDirectoryRecord();
		block2.comment = "Hello World";
		expect(block2.arrayBuffer.byteLength).toEqual(33);
		expect(block2.commentLength).toEqual(11);
		expect(block2.comment).toEqual("Hello World");

		const block3 = new EndOfCentralDirectoryRecord();
		block3.numberOfThisDisk = 1;
		block3.centralDirectoryDiskNumber = 2;
		block3.entriesInThisDisk = 3;
		block3.totalEntries = 4;
		block3.sizeOfCentralDirectory = 5;
		block3.offsetToCentralDirectory = 6;
		block3.comment = "Hello World";
		expect(block3.arrayBuffer.byteLength).toEqual(33);
		expect(block3.numberOfThisDisk).toEqual(1);
		expect(block3.centralDirectoryDiskNumber).toEqual(2);
		expect(block3.entriesInThisDisk).toEqual(3);
		expect(block3.totalEntries).toEqual(4);
		expect(block3.sizeOfCentralDirectory).toEqual(5);
		expect(block3.offsetToCentralDirectory).toEqual(6);
		expect(block3.commentLength).toEqual(11);
		expect(block3.comment).toEqual("Hello World");
	});

	test("Zip64EndOfCentralDirectoryLocator", () => {
		const block1 = new Zip64EndOfCentralDirectoryLocator();
		expect(block1.arrayBuffer.byteLength).toEqual(20);

		const block3 = new Zip64EndOfCentralDirectoryLocator();
		block3.centralDirectoryDiskNumber = 1;
		block3.offsetToCentralDirectory = 2;
		block3.totalNumberOfDisk = 3;
		expect(block3.arrayBuffer.byteLength).toEqual(20);
		expect(block3.centralDirectoryDiskNumber).toEqual(1);
		expect(block3.offsetToCentralDirectory).toEqual(2);
		expect(block3.totalNumberOfDisk).toEqual(3);
	});

	test("Zip64EndOfCentralDirectoryRecord", () => {
		const block1 = new Zip64EndOfCentralDirectoryRecord();
		expect(block1.arrayBuffer.byteLength).toEqual(56);
		expect(block1.sizeOfRecord).toEqual(44);

		const block2 = new Zip64EndOfCentralDirectoryRecord();
		block2.comment = "Hello World";
		expect(block2.arrayBuffer.byteLength).toEqual(67);
		expect(block2.sizeOfRecord).toEqual(55);
		expect(block2.commentLength).toEqual(11);
		expect(block2.comment).toEqual("Hello World");

		const block3 = new Zip64EndOfCentralDirectoryRecord();
		block3.createdZipSpec = 2;
		block3.createdOS = 3;
		block3.extractedZipSpec = 4;
		block3.extractedOS = 5;
		block3.numberOfThisDisk = 6;
		block3.centralDirectoryDiskNumber = 7;
		block3.entriesInThisDisk = 8;
		block3.totalEntries = 9;
		block3.sizeOfCentralDirectory = 10;
		block3.offsetToCentralDirectory = 11;
		expect(block3.sizeOfRecord).toEqual(44);
		expect(block3.createdZipSpec).toEqual(2);
		expect(block3.createdOS).toEqual(3);
		expect(block3.extractedZipSpec).toEqual(4);
		expect(block3.extractedOS).toEqual(5);
		expect(block3.numberOfThisDisk).toEqual(6);
		expect(block3.centralDirectoryDiskNumber).toEqual(7);
		expect(block3.entriesInThisDisk).toEqual(8);
		expect(block3.totalEntries).toEqual(9);
		expect(block3.sizeOfCentralDirectory).toEqual(10);
		expect(block3.offsetToCentralDirectory).toEqual(11);
	});

	test("CentralDirectoryFileHeader", () => {
		const block1 = new CentralDirectoryFileHeader();
		expect(block1.arrayBuffer.byteLength).toEqual(46);

		const block2 = new CentralDirectoryFileHeader();
		block2.fileName = "Hello World";
		expect(block2.arrayBuffer.byteLength).toEqual(57);
		expect(block2.fileNameLength).toEqual(11);
		expect(block2.fileName).toEqual("Hello World");

		const block3 = new CentralDirectoryFileHeader();
		block3.comment = "Hello World";
		expect(block3.arrayBuffer.byteLength).toEqual(57);
		expect(block3.commentLength).toEqual(11);
		expect(block3.comment).toEqual("Hello World");

		const block4 = new CentralDirectoryFileHeader();
		block4.extra = new Uint8Array(4);
		expect(block4.arrayBuffer.byteLength).toEqual(50);
		expect(block4.extraLength).toEqual(4);
		expect(Array.from(block4.extra)).toEqual([0, 0, 0, 0]);

		const block5 = new CentralDirectoryFileHeader();
		block5.fileName = "Hello World";
		block5.comment = "Foobar";
		expect(block5.arrayBuffer.byteLength).toEqual(63);
		expect(block5.fileNameLength).toEqual(11);
		expect(block5.fileName).toEqual("Hello World");
		expect(block5.commentLength).toEqual(6);
		expect(block5.comment).toEqual("Foobar");

		const block6 = new CentralDirectoryFileHeader();
		block6.fileName = "Hello World";
		block6.extra = new Uint8Array(4);
		expect(block6.arrayBuffer.byteLength).toEqual(61);
		expect(block6.fileNameLength).toEqual(11);
		expect(block6.fileName).toEqual("Hello World");
		expect(block6.extraLength).toEqual(4);
		expect(Array.from(block6.extra)).toEqual([0, 0, 0, 0]);

		const block7 = new CentralDirectoryFileHeader();
		block7.comment = "Foobar";
		block7.extra = new Uint8Array(4);
		expect(block7.arrayBuffer.byteLength).toEqual(56);
		expect(block7.commentLength).toEqual(6);
		expect(block7.comment).toEqual("Foobar");
		expect(block7.extraLength).toEqual(4);
		expect(Array.from(block7.extra)).toEqual([0, 0, 0, 0]);

		const block8 = new CentralDirectoryFileHeader();
		const now = new Date(2022, 9, 20, 1, 2, 0);
		block8.createdZipSpec = 1;
		block8.createdOS = 2;
		block8.extractedZipSpec = 3;
		block8.extractedOS = 4;
		block8.generalPurposeFlag = 5;
		block8.compressionMethod = 6;
		block8.lastModificationDate = now;
		block8.crc = 7;
		block8.compressedLength = 8;
		block8.uncompressedLength = 9;
		block8.diskStart = 10;
		block8.internalFileAttribute = 11;
		block8.externalFileAttribute = 12;
		block8.localFileOffset = 13;
		expect(block8.createdZipSpec).toEqual(1);
		expect(block8.createdOS).toEqual(2);
		expect(block8.extractedZipSpec).toEqual(3);
		expect(block8.extractedOS).toEqual(4);
		expect(block8.generalPurposeFlag).toEqual(5);
		expect(block8.compressionMethod).toEqual(6);
		expect(block8.lastModificationDate).toEqual(now);
		expect(block8.crc).toEqual(7);
		expect(block8.compressedLength).toEqual(8);
		expect(block8.uncompressedLength).toEqual(9);
		expect(block8.diskStart).toEqual(10);
		expect(block8.internalFileAttribute).toEqual(11);
		expect(block8.externalFileAttribute).toEqual(12);
		expect(block8.localFileOffset).toEqual(13);
	});

	test("Zip64ExtendedInformation", () => {
		const block1 = new Zip64ExtensibleDataField(0);
		block1.originalUncompressedData = 1;
		block1.sizeOfCompressedData = 2;
		block1.offsetOfLocalHeaderRecord = 3;
		block1.localHeaderDiskNumber = 4;
		expect(block1.arrayBuffer.byteLength).toEqual(4);
		expect(block1.length).toEqual(0);
		expect(block1.originalUncompressedData).toEqual(null);
		expect(block1.sizeOfCompressedData).toEqual(null);
		expect(block1.offsetOfLocalHeaderRecord).toEqual(null);
		expect(block1.localHeaderDiskNumber).toEqual(null);

		const block2 = new Zip64ExtensibleDataField(8);
		block2.originalUncompressedData = 1;
		block2.sizeOfCompressedData = 2;
		block2.offsetOfLocalHeaderRecord = 3;
		block2.localHeaderDiskNumber = 4;
		expect(block2.arrayBuffer.byteLength).toEqual(12);
		expect(block2.length).toEqual(8);
		expect(block2.originalUncompressedData).toEqual(1);
		expect(block2.sizeOfCompressedData).toEqual(null);
		expect(block2.offsetOfLocalHeaderRecord).toEqual(null);
		expect(block2.localHeaderDiskNumber).toEqual(null);

		const block3 = new Zip64ExtensibleDataField(16);
		block3.originalUncompressedData = 1;
		block3.sizeOfCompressedData = 2;
		block3.offsetOfLocalHeaderRecord = 3;
		block3.localHeaderDiskNumber = 4;
		expect(block3.arrayBuffer.byteLength).toEqual(20);
		expect(block3.length).toEqual(16);
		expect(block3.originalUncompressedData).toEqual(1);
		expect(block3.sizeOfCompressedData).toEqual(2);
		expect(block3.offsetOfLocalHeaderRecord).toEqual(null);
		expect(block3.localHeaderDiskNumber).toEqual(null);

		const block4 = new Zip64ExtensibleDataField(24);
		block4.originalUncompressedData = 1;
		block4.sizeOfCompressedData = 2;
		block4.offsetOfLocalHeaderRecord = 3;
		block4.localHeaderDiskNumber = 4;
		expect(block4.arrayBuffer.byteLength).toEqual(28);
		expect(block4.length).toEqual(24);
		expect(block4.originalUncompressedData).toEqual(1);
		expect(block4.sizeOfCompressedData).toEqual(2);
		expect(block4.offsetOfLocalHeaderRecord).toEqual(3);
		expect(block4.localHeaderDiskNumber).toEqual(null);

		const block5 = new Zip64ExtensibleDataField(28);
		block5.originalUncompressedData = 1;
		block5.sizeOfCompressedData = 2;
		block5.offsetOfLocalHeaderRecord = 3;
		block5.localHeaderDiskNumber = 4;
		expect(block5.arrayBuffer.byteLength).toEqual(32);
		expect(block5.length).toEqual(28);
		expect(block5.originalUncompressedData).toEqual(1);
		expect(block5.sizeOfCompressedData).toEqual(2);
		expect(block5.offsetOfLocalHeaderRecord).toEqual(3);
		expect(block5.localHeaderDiskNumber).toEqual(4);
	});

	test("LocalFileHeader", () => {
		const block1 = new LocalFileHeader();
		expect(block1.arrayBuffer.byteLength).toEqual(30);

		const block2 = new LocalFileHeader();
		block2.fileName = "Hello World";
		expect(block2.arrayBuffer.byteLength).toEqual(41);
		expect(block2.fileNameLength).toEqual(11);
		expect(block2.fileName).toEqual("Hello World");

		const block3 = new LocalFileHeader();
		block3.extra = new Uint8Array(4);
		expect(block3.arrayBuffer.byteLength).toEqual(34);
		expect(block3.extraLength).toEqual(4);
		expect(Array.from(block3.extra)).toEqual([0, 0, 0, 0]);

		const block4 = new LocalFileHeader();
		block4.fileName = "Hello World";
		block4.extra = new Uint8Array(4);
		expect(block4.arrayBuffer.byteLength).toEqual(45);
		expect(block4.fileNameLength).toEqual(11);
		expect(block4.fileName).toEqual("Hello World");
		expect(block4.extraLength).toEqual(4);
		expect(Array.from(block4.extra)).toEqual([0, 0, 0, 0]);

		const block5 = new LocalFileHeader();
		const now = new Date(2022, 9, 20, 1, 2, 0);
		block5.extractedZipSpec = 1;
		block5.extractedOS = 2;
		block5.generalPurposeFlag = 3;
		block5.compressionMethod = 4;
		block5.lastModificationDate = now;
		block5.crc = 5;
		block5.compressedLength = 6;
		block5.uncompressedLength = 7;
		expect(block5.extractedZipSpec).toEqual(1);
		expect(block5.extractedOS).toEqual(2);
		expect(block5.generalPurposeFlag).toEqual(3);
		expect(block5.compressionMethod).toEqual(4);
		expect(block5.lastModificationDate).toEqual(now);
		expect(block5.crc).toEqual(5);
		expect(block5.compressedLength).toEqual(6);
		expect(block5.uncompressedLength).toEqual(7);
	});

	test("DataDescriptor", () => {
		const block1 = new DataDescriptor();
		expect(block1.arrayBuffer.byteLength).toEqual(16);

		const block2 = new DataDescriptor();
		block2.crc = 1;
		block2.compressedLength = 2;
		block2.uncompressedLength = 3;
		expect(block2.arrayBuffer.byteLength).toEqual(16);
		expect(block2.crc).toEqual(1);
		expect(block2.compressedLength).toEqual(2);
		expect(block2.uncompressedLength).toEqual(3);
	});

	test("Zip64DataDescriptor", () => {
		const block1 = new Zip64DataDescriptor();
		expect(block1.arrayBuffer.byteLength).toEqual(24);

		const block2 = new Zip64DataDescriptor();
		block2.crc = 1;
		block2.compressedLength = 2;
		block2.uncompressedLength = 3;
		expect(block2.arrayBuffer.byteLength).toEqual(24);
		expect(block2.crc).toEqual(1);
		expect(block2.compressedLength).toEqual(2);
		expect(block2.uncompressedLength).toEqual(3);
	});

});