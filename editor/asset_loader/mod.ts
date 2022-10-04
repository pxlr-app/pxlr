import { Image } from "../../libpxlr/image.ts";

export interface AssetLoader {
	loadImage(path: string, options?: { signal: AbortSignal }): Promise<Image>;
}
