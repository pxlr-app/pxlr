import { join, extname, isAbsolute, resolve, dirname, fromFileUrl } from "https://deno.land/std@0.155.0/path/mod.ts";
import { mime } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.1/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.15.8/mod.js";

let importMapBase = "";
let importMap: { imports: Record<string, string> } | undefined;
const inputMain = join(Deno.cwd(), "index.tsx");
const outputDir = join(Deno.cwd(), "dist");

const BundleHttpModule: esbuild.Plugin = {
	name: "BundleHttpModule",
	setup(build) {
		build.onResolve({ filter: /^https?:\/\// }, (args) => ({
			path: args.path,
			namespace: "bundle-http",
		}));
		build.onResolve({ filter: /.*/, namespace: "bundle-http" }, (args) => ({
			path: new URL(args.path, args.importer).toString(),
			namespace: "bundle-http",
		}));
		build.onLoad({ filter: /.*/, namespace: 'bundle-http' }, async (args) => {
			for (const [url, map] of Object.entries(importMap?.imports ?? {})) {
				if (args.path.substring(0, url.length) === url) {
					args.path = join(importMapBase, map, args.path.substring(url.length));
					break;
				}
			}
			if (isAbsolute(args.path)) {
				const contents = await Deno.readTextFile(args.path);
				const ext = extname(args.path);
				return { contents, loader: ext.includes('js') ? 'jsx' : 'tsx' };
			} else {
				const response = await fetch(args.path)
				const contents = await response.text();
				const contentType = response.headers.get('Content-Type') ?? 'text/javascript; charset=utf-8';
				return { contents, loader: contentType.includes('javascript') ? 'jsx' : 'tsx' };
			}
		});
	},
};

const build = new Command()
	.name("build")
	.action(async () => {
		console.log('build...');

		await Deno.remove("dist", { recursive: true }).catch(_ => {});

		await esbuild.build({
			entryPoints: [inputMain],
			outdir: outputDir,
			bundle: true,
			minify: true,
			metafile: false,
			target: "esnext",
			format: "esm",
			platform: "browser",
			plugins: [BundleHttpModule],
			jsxFactory: "h",
			jsxFragment: "Fragment",
		});

		await Deno.copyFile("index.html", "dist/index.html");

		Deno.exit(0);
	})

const dev = new Command()
	.name("dev")
	.action(async () => {
		console.log('Dev...');
		await esbuild.initialize({});
		const cache = await caches.open('build');
		let result = await esbuild.build({
			entryPoints: [inputMain],
			outdir: outputDir,
			write: false,
			bundle: true,
			minify: false,
			metafile: true,
			target: "esnext",
			format: "esm",
			platform: "browser",
			plugins: [BundleHttpModule],
			jsxFactory: "h",
			jsxFragment: "Fragment",
		});
		// TODO watch changes on result.metafile.inputs and refresh result & cache
		Deno.serve({
			async handler(req: Request) {
				const url = new URL(req.url);
				console.log(`- [${new Date().toISOString()}] ${req.method} ${url.pathname}`);
				const cached = await cache.match(url);
				if (cached) {
					return cached;
				}
				let response: Response;
				if (['/', '/index.html'].includes(url.pathname)) {
					const file = await Deno.open(fromFileUrl(import.meta.resolve('./index.html')), { read: true })
					response = new Response(file.readable, { headers: { 'Content-Type': 'text/html' } });
				}
				else {
					const outputFilePath = join(outputDir, url.pathname);
					const outputFile = result.outputFiles.find(f => f.path === outputFilePath);
					if (!outputFile) {
						response = new Response(null, { status: 404 });
					} else {
						response = new Response(outputFile.contents, { headers: { 'Content-Type': mime.getType(extname(outputFilePath) ?? '.txt')! } })
					}
				}
				cache.put(url, response.clone());
				return response;
			}
		})
	})

const main = new Command()
	.name("Pxlr Editor Builder")
	.command("build", build)
	.command("dev", dev);


try {
	await main.parse(Deno.args);
} catch (err) {
	console.error(err);
	Deno.exit(1);
}