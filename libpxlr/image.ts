export class ImageFormat {
	static readonly I8 = new ImageFormat("i8", 8);
	static readonly R8G8B8 = new ImageFormat("r8g8b8", 24);
	static readonly R8G8B8A8 = new ImageFormat("r8g8b8a8", 32);
	static readonly U16V16 = new ImageFormat("u16v16", 32);

	public constructor(public readonly identifier: string, public readonly length: number) {}
}

export class Image {
	public constructor(
		public readonly width: number,
		public readonly height: number,
		public readonly format: ImageFormat,
		public readonly frames: ReadonlyArray<ArrayBuffer>,
	) {
	}
}
