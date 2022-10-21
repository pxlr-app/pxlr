import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import {
	CentralDirectoryFileHeader,
	DataDescriptor,
	EndOfCentralDirectoryRecord,
	LocalFileHeader,
	Zip64DataDescriptor,
	Zip64EndOfCentralDirectoryLocator,
	Zip64EndOfCentralDirectoryRecord,
	Zip64ExtendedInformation,
} from "./block.ts";

Deno.test("EndOfCentralDirectoryRecord", () => {
	const block1 = new EndOfCentralDirectoryRecord();
	assertEquals(block1.arrayBuffer.byteLength, 22);
	assertEquals(block1.commentLength, 0);
	assertEquals(block1.comment, "");

	const block2 = new EndOfCentralDirectoryRecord();
	block2.comment = "Hello World";
	assertEquals(block2.arrayBuffer.byteLength, 33);
	assertEquals(block2.commentLength, 11);
	assertEquals(block2.comment, "Hello World");

	const block3 = new EndOfCentralDirectoryRecord();
	block3.numberOfThisDisk = 1;
	block3.centralDirectoryDiskNumber = 2;
	block3.entriesInThisDisk = 3;
	block3.totalEntries = 4;
	block3.sizeOfCentralDirectory = 5;
	block3.offsetToCentralDirectory = 6;
	block3.comment = "Hello World";
	assertEquals(block3.arrayBuffer.byteLength, 33);
	assertEquals(block3.numberOfThisDisk, 1);
	assertEquals(block3.centralDirectoryDiskNumber, 2);
	assertEquals(block3.entriesInThisDisk, 3);
	assertEquals(block3.totalEntries, 4);
	assertEquals(block3.sizeOfCentralDirectory, 5);
	assertEquals(block3.offsetToCentralDirectory, 6);
	assertEquals(block3.commentLength, 11);
	assertEquals(block3.comment, "Hello World");
});

Deno.test("Zip64EndOfCentralDirectoryLocator", () => {
	const block1 = new Zip64EndOfCentralDirectoryLocator();
	assertEquals(block1.arrayBuffer.byteLength, 20);

	const block3 = new Zip64EndOfCentralDirectoryLocator();
	block3.centralDirectoryDiskNumber = 1;
	block3.offsetToCentralDirectory = 2;
	block3.totalNumberOfDisk = 3;
	assertEquals(block3.arrayBuffer.byteLength, 20);
	assertEquals(block3.centralDirectoryDiskNumber, 1);
	assertEquals(block3.offsetToCentralDirectory, 2);
	assertEquals(block3.totalNumberOfDisk, 3);
});

Deno.test("Zip64EndOfCentralDirectoryRecord", () => {
	const block1 = new Zip64EndOfCentralDirectoryRecord();
	assertEquals(block1.arrayBuffer.byteLength, 56);
	assertEquals(block1.sizeOfRecord, 44);

	const block2 = new Zip64EndOfCentralDirectoryRecord();
	block2.comment = "Hello World";
	assertEquals(block2.arrayBuffer.byteLength, 67);
	assertEquals(block2.sizeOfRecord, 55);
	assertEquals(block2.commentLength, 11);
	assertEquals(block2.comment, "Hello World");

	const block3 = new Zip64EndOfCentralDirectoryRecord();
	block3.sizeOfRecord = 1;
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
	assertEquals(block3.sizeOfRecord, 1);
	assertEquals(block3.createdZipSpec, 2);
	assertEquals(block3.createdOS, 3);
	assertEquals(block3.extractedZipSpec, 4);
	assertEquals(block3.extractedOS, 5);
	assertEquals(block3.numberOfThisDisk, 6);
	assertEquals(block3.centralDirectoryDiskNumber, 7);
	assertEquals(block3.entriesInThisDisk, 8);
	assertEquals(block3.totalEntries, 9);
	assertEquals(block3.sizeOfCentralDirectory, 10);
	assertEquals(block3.offsetToCentralDirectory, 11);
});

Deno.test("CentralDirectoryFileHeader", () => {
	const block1 = new CentralDirectoryFileHeader();
	assertEquals(block1.arrayBuffer.byteLength, 46);

	const block2 = new CentralDirectoryFileHeader();
	block2.fileName = "Hello World";
	assertEquals(block2.arrayBuffer.byteLength, 57);
	assertEquals(block2.fileNameLength, 11);
	assertEquals(block2.fileName, "Hello World");

	const block3 = new CentralDirectoryFileHeader();
	block3.comment = "Hello World";
	assertEquals(block3.arrayBuffer.byteLength, 57);
	assertEquals(block3.commentLength, 11);
	assertEquals(block3.comment, "Hello World");

	const block4 = new CentralDirectoryFileHeader();
	block4.extra = new Uint8Array(4);
	assertEquals(block4.arrayBuffer.byteLength, 50);
	assertEquals(block4.extraLength, 4);
	assertEquals(Array.from(block4.extra), [0, 0, 0, 0]);

	const block5 = new CentralDirectoryFileHeader();
	block5.fileName = "Hello World";
	block5.comment = "Foobar";
	assertEquals(block5.arrayBuffer.byteLength, 63);
	assertEquals(block5.fileNameLength, 11);
	assertEquals(block5.fileName, "Hello World");
	assertEquals(block5.commentLength, 6);
	assertEquals(block5.comment, "Foobar");

	const block6 = new CentralDirectoryFileHeader();
	block6.fileName = "Hello World";
	block6.extra = new Uint8Array(4);
	assertEquals(block6.arrayBuffer.byteLength, 61);
	assertEquals(block6.fileNameLength, 11);
	assertEquals(block6.fileName, "Hello World");
	assertEquals(block6.extraLength, 4);
	assertEquals(Array.from(block6.extra), [0, 0, 0, 0]);

	const block7 = new CentralDirectoryFileHeader();
	block7.comment = "Foobar";
	block7.extra = new Uint8Array(4);
	assertEquals(block7.arrayBuffer.byteLength, 56);
	assertEquals(block7.commentLength, 6);
	assertEquals(block7.comment, "Foobar");
	assertEquals(block7.extraLength, 4);
	assertEquals(Array.from(block7.extra), [0, 0, 0, 0]);

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
	assertEquals(block8.createdZipSpec, 1);
	assertEquals(block8.createdOS, 2);
	assertEquals(block8.extractedZipSpec, 3);
	assertEquals(block8.extractedOS, 4);
	assertEquals(block8.generalPurposeFlag, 5);
	assertEquals(block8.compressionMethod, 6);
	assertEquals(block8.lastModificationDate, now);
	assertEquals(block8.crc, 7);
	assertEquals(block8.compressedLength, 8);
	assertEquals(block8.uncompressedLength, 9);
	assertEquals(block8.diskStart, 10);
	assertEquals(block8.internalFileAttribute, 11);
	assertEquals(block8.externalFileAttribute, 12);
	assertEquals(block8.localFileOffset, 13);
});

Deno.test("Zip64ExtendedInformation", () => {
	const block1 = new Zip64ExtendedInformation();
	assertEquals(block1.arrayBuffer.byteLength, 4);
	assertEquals(block1.length, 0);
	assertEquals(block1.originalUncompressedData, 0);
	assertEquals(block1.sizeOfCompressedData, 0);
	assertEquals(block1.offsetOfLocalHeaderRecord, 0);
	assertEquals(block1.localHeaderDiskNumber, 0);

	const block2 = new Zip64ExtendedInformation();
	block2.originalUncompressedData = 1;
	assertEquals(block2.arrayBuffer.byteLength, 12);
	assertEquals(block2.length, 8);
	assertEquals(block2.originalUncompressedData, 1);
	assertEquals(block2.sizeOfCompressedData, 0);
	assertEquals(block2.offsetOfLocalHeaderRecord, 0);
	assertEquals(block2.localHeaderDiskNumber, 0);

	const block3 = new Zip64ExtendedInformation();
	block3.originalUncompressedData = 1;
	block3.sizeOfCompressedData = 2;
	assertEquals(block3.arrayBuffer.byteLength, 20);
	assertEquals(block3.length, 16);
	assertEquals(block3.originalUncompressedData, 1);
	assertEquals(block3.sizeOfCompressedData, 2);
	assertEquals(block3.offsetOfLocalHeaderRecord, 0);
	assertEquals(block3.localHeaderDiskNumber, 0);

	const block4 = new Zip64ExtendedInformation();
	block4.originalUncompressedData = 1;
	block4.sizeOfCompressedData = 2;
	block4.offsetOfLocalHeaderRecord = 3;
	assertEquals(block4.arrayBuffer.byteLength, 28);
	assertEquals(block4.length, 24);
	assertEquals(block4.originalUncompressedData, 1);
	assertEquals(block4.sizeOfCompressedData, 2);
	assertEquals(block4.offsetOfLocalHeaderRecord, 3);
	assertEquals(block4.localHeaderDiskNumber, 0);

	const block5 = new Zip64ExtendedInformation();
	block5.originalUncompressedData = 1;
	block5.sizeOfCompressedData = 2;
	block5.offsetOfLocalHeaderRecord = 3;
	block5.localHeaderDiskNumber = 4;
	assertEquals(block5.arrayBuffer.byteLength, 32);
	assertEquals(block5.length, 28);
	assertEquals(block5.originalUncompressedData, 1);
	assertEquals(block5.sizeOfCompressedData, 2);
	assertEquals(block5.offsetOfLocalHeaderRecord, 3);
	assertEquals(block5.localHeaderDiskNumber, 4);
});

Deno.test("LocalFileHeader", () => {
	const block1 = new LocalFileHeader();
	assertEquals(block1.arrayBuffer.byteLength, 30);

	const block2 = new LocalFileHeader();
	block2.fileName = "Hello World";
	assertEquals(block2.arrayBuffer.byteLength, 41);
	assertEquals(block2.fileNameLength, 11);
	assertEquals(block2.fileName, "Hello World");

	const block3 = new LocalFileHeader();
	block3.extra = new Uint8Array(4);
	assertEquals(block3.arrayBuffer.byteLength, 34);
	assertEquals(block3.extraLength, 4);
	assertEquals(Array.from(block3.extra), [0, 0, 0, 0]);

	const block4 = new LocalFileHeader();
	block4.fileName = "Hello World";
	block4.extra = new Uint8Array(4);
	assertEquals(block4.arrayBuffer.byteLength, 45);
	assertEquals(block4.fileNameLength, 11);
	assertEquals(block4.fileName, "Hello World");
	assertEquals(block4.extraLength, 4);
	assertEquals(Array.from(block4.extra), [0, 0, 0, 0]);

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
	assertEquals(block5.extractedZipSpec, 1);
	assertEquals(block5.extractedOS, 2);
	assertEquals(block5.generalPurposeFlag, 3);
	assertEquals(block5.compressionMethod, 4);
	assertEquals(block5.lastModificationDate, now);
	assertEquals(block5.crc, 5);
	assertEquals(block5.compressedLength, 6);
	assertEquals(block5.uncompressedLength, 7);
});

Deno.test("DataDescriptor", () => {
	const block1 = new DataDescriptor();
	assertEquals(block1.arrayBuffer.byteLength, 16);

	const block2 = new DataDescriptor();
	block2.crc = 1;
	block2.compressedLength = 2;
	block2.uncompressedLength = 3;
	assertEquals(block2.arrayBuffer.byteLength, 16);
	assertEquals(block2.crc, 1);
	assertEquals(block2.compressedLength, 2);
	assertEquals(block2.uncompressedLength, 3);
});

Deno.test("Zip64DataDescriptor", () => {
	const block1 = new Zip64DataDescriptor();
	assertEquals(block1.arrayBuffer.byteLength, 24);

	const block2 = new Zip64DataDescriptor();
	block2.crc = 1;
	block2.compressedLength = 2;
	block2.uncompressedLength = 3;
	assertEquals(block2.arrayBuffer.byteLength, 24);
	assertEquals(block2.crc, 1);
	assertEquals(block2.compressedLength, 2);
	assertEquals(block2.uncompressedLength, 3);
});
