import * as esbuild from "https://deno.land/x/esbuild@v0.15.8/mod.js";
import { join, dirname, isAbsolute, extname } from "https://deno.land/std@0.156.0/path/mod.ts";

let importMapBase = "";
let importMap: { imports: Record<string, string> } | undefined;

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

await esbuild.build({
	entryPoints: [join(Deno.cwd(), "mod.ts")],
	outfile: "index.mjs",
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

Deno.exit(0);