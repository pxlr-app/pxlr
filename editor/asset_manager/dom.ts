import { resolve } from "https://deno.land/std@0.158.0/path/win32.ts";
import { AssetManager, Image, ImageFormat } from "./mod.ts";

export class DOMAssetManager implements AssetManager {
	async loadImage(path: string, _options?: { signal?: AbortSignal }): Promise<Image> {
		const image = await new Promise<HTMLImageElement>((resolve, reject) => {
			const image = new globalThis.Image();
			image.onload = () => resolve(image);
			image.onerror = (err) => reject(err);
			image.src = path;
		});
		const canvas = document.createElement("canvas");
		canvas.width = image.width;
		canvas.height = image.height;
		const context = canvas.getContext("2d");
		if (context) {
			context.imageSmoothingEnabled = false;
			context.drawImage(image, 0, 0);
			const imageData = context.getImageData(0, 0, image.width, image.height);
			return new Image(image.width, image.height, ImageFormat.R8G8B8A8, [imageData.data]);
		}
		throw new Error(`Could not create CanvasRenderingContext2D.`);
	}
}
