import { Image } from "../../libpxlr/image.ts";
export { Image, ImageFormat } from "../../libpxlr/image.ts";

export interface AssetManager {
	loadImage(path: string, options?: { signal: AbortSignal }): Promise<Image>;
}
