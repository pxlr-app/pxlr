import { Image, ImageFormat } from "./image.ts";

export class TiledImage {
	#arrayBuffer: ArrayBuffer;
	#tileOccupied: ReadonlyArray<boolean>;

	public constructor(
		public readonly width: number,
		public readonly height: number,
		public readonly tileWidth: number,
		public readonly tileHeight: number,
		public readonly format: ImageFormat,
	) {
		this.#arrayBuffer = new Uint8Array(width * height * format.length);
		this.#tileOccupied = new Array(~~(width / tileWidth) * ~~(height / tileHeight)).fill(false);
	}

	public addImage(image: Image) {
		// Same image format?
		// For each image frames
		//   Slice into tiles
		//   For each slice
		//     Select unoccupied tile
		//     Clear it before hand?
		//     Copy buffer to arrayBuffer
		// Return a disposer that flag tiles as unoccupied
	}
}
