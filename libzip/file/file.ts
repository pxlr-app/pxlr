export enum SeekFrom {
	Start = 0,
	Current = 1,
	End = 2,
}

export interface File {
	read(buffer: Uint8Array): Promise<number | null>;
	seek(offset: number, from: SeekFrom): Promise<number>;
	write(buffer: Uint8Array): Promise<number>;
	close(): Promise<void>;
}
