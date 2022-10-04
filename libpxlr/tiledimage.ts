import { ImageFormat } from "./image.ts";

export class Tile<T> {
	public constructor(
		public readonly index: number,
		public readonly data?: T
	) {}
}

export class TiledImage<T> {

	public readonly arrayBuffer: ArrayBuffer;
	public readonly tiles: ReadonlyArray<Tile<T>>;

	public constructor(
		public readonly width: number,
		public readonly height: number,
		public readonly tileSize: number,
		public readonly imageFormat: ImageFormat,
	) {
		this.arrayBuffer = new Uint8Array(width * height * imageFormat.length);
		this.tiles = [...new Array(~~(width / tileSize) * ~~(height / tileSize))].map((_, i) => new Tile(i));
	}

	
}