export class ImageFormat {
	static readonly I8 = new ImageFormat("i8", 8);
	static readonly R8G8 = new ImageFormat("r8g8", 16);
	static readonly R8G8B8 = new ImageFormat("r8g8b8", 24);
	static readonly R8G8B8A8 = new ImageFormat("r8g8b8a8", 32);
	static readonly U16V16 = new ImageFormat("u16v16", 32);
	static readonly U32V32 = new ImageFormat("u32v32", 64);

	public constructor(public readonly type: string, public readonly length: number) {}
}

export class Image {
	public constructor(
		public readonly width: number,
		public readonly height: number,
		public readonly imageFormat: ImageFormat,
		public readonly arrayBuffer: Readonly<ArrayBuffer>
	) {}
}