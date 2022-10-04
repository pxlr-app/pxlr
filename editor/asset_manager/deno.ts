import { AssetManager, Image, ImageFormat } from "./mod.ts";
import { decode, GIF as _GIF, Image as _Image } from "https://deno.land/x/imagescript@v1.2.14/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.158.0/path/mod.ts";

export class DenoAssetManager implements AssetManager {
	async loadImage(path: string, options?: { signal?: AbortSignal }): Promise<Image> {
		const file = await Deno.readFile(fromFileUrl(path), { signal: options?.signal });
		const image = await decode(file);

		if (image instanceof _GIF) {
			return new Image(image.width, image.height, ImageFormat.I8, image.map((frame) => frame.bitmap));
		} else {
			return new Image(image.width, image.height, ImageFormat.R8G8B8A8, [image.bitmap]);
		}
	}
}
