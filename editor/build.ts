import { extname, fromFileUrl, isAbsolute, join, relative } from "https://deno.land/std@0.155.0/path/mod.ts";
import { mime } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.1/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.15.8/mod.js";

const inputMain = fromFileUrl(import.meta.resolve("./index.tsx"));
const outputDir = fromFileUrl(import.meta.resolve("./dist"));

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
		build.onLoad({ filter: /.*/, namespace: "bundle-http" }, async (args) => {
			if (isAbsolute(args.path)) {
				const contents = await Deno.readTextFile(args.path);
				const ext = extname(args.path);
				return { contents, loader: ext.includes("js") ? "jsx" : "tsx" };
			} else {
				const response = await fetch(args.path);
				const contents = await response.text();
				const contentType = response.headers.get("Content-Type") ?? "text/javascript; charset=utf-8";
				return { contents, loader: contentType.includes("javascript") ? "jsx" : "tsx" };
			}
		});
	},
};

const baseBuildOptions: esbuild.BuildOptions = {
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
};

const build = new Command()
	.name("build")
	.action(async () => {
		await Deno.remove(fromFileUrl(import.meta.resolve("./dist")), { recursive: true }).catch((_) => {});
		await esbuild.build(baseBuildOptions);
		await Deno.copyFile(fromFileUrl(import.meta.resolve("./index.html")), fromFileUrl(import.meta.resolve("./dist/index.html")));

		Deno.exit(0);
	});

const dev = new Command()
	.name("dev")
	.action(async () => {
		await esbuild.initialize({});
		const cache = await caches.open(`pxlr`);
		let result: esbuild.BuildResult = await esbuild.build({
			...baseBuildOptions,
			minify: false,
			write: false,
			watch: {
				onRebuild(error, newResult) {
					if (error) {
						console.error(error);
					}
					if (newResult) {
						// TODO trigger HMR
						for (const outputFile of (result.outputFiles ?? [])) {
							const url = new URL(`http://127.0.0.1:9000/${relative(outputDir, outputFile.path)}`);
							cache.delete(url);
						}
						result = newResult;
					}
				},
			},
		});
		for (const outputFile of (result.outputFiles ?? [])) {
			const url = new URL(`http://127.0.0.1:9000/${relative(outputDir, outputFile.path)}`);
			cache.delete(url);
		}
		cache.delete(new URL(`http://127.0.0.1:9000/`));
		cache.delete(new URL(`http://127.0.0.1:9000/index.html`));
		Deno.serve({
			async handler(req: Request) {
				const url = new URL(req.url);
				const start = performance.now();
				let res = new Response(null, { status: 404 });
				try {
					const cached = await cache.match(url);
					if (cached) {
						res = cached;
					} else if (["/", "/index.html"].includes(url.pathname)) {
						const file = await Deno.open(fromFileUrl(import.meta.resolve("./index.html")), { read: true });
						res = new Response(file.readable.pipeThrough(new CompressionStream("gzip")), {
							headers: {
								"Content-Encoding": "gzip",
								"Content-Type": "text/html",
							},
						});
						cache.put(url, res.clone());
					} else if (result.outputFiles) {
						const outputFilePath = join(outputDir, url.pathname);
						const outputFile = result.outputFiles.find((f) => f.path === outputFilePath);
						if (outputFile) {
							const gzip = new CompressionStream("gzip");
							const w = gzip.writable.getWriter();
							w.write(outputFile.contents);
							w.close();
							res = new Response(gzip.readable, {
								headers: {
									"Content-Encoding": "gzip",
									"Content-Type": mime.getType(extname(outputFilePath) ?? ".txt")!,
								},
							});
							cache.put(url, res.clone());
						}
					}
					return res;
				} finally {
					console.log(`-.-.-.- [${new Date().toISOString()}] ${(performance.now() - start).toFixed(2)}ms ${req.method} ${url.pathname} ${res.status}`);
				}
			},
		});
	});

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
