import { Command } from "https://deno.land/x/cliffy@v0.25.1/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.15.8/mod.js";
import { apply, setup } from "https://esm.sh/v94/twind@0.16.17/";
import { getStyleTagProperties, shim, virtualSheet } from "https://esm.sh/v94/twind@0.16.17/shim/server";
import { walk } from "https://deno.land/std@0.156.0/fs/mod.ts";
import { join, isAbsolute, extname, globToRegExp } from "https://deno.land/std@0.156.0/path/mod.ts";

const args = await new Command()
	.option("--watch", "Watch")
	.parse(Deno.args)

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

let index = await Deno.readTextFile(join(Deno.cwd(), 'editor/index.html'));
index = index.replaceAll('/index.tsx', '/index.js');
await Deno.writeTextFile(join(Deno.cwd(), 'dist/index.html'), index);

const sheet = virtualSheet();
setup({
	sheet,
	preflight: {
		'html, body': apply`w-full h-full bg-gray-900`,
		'#root': apply`flex h-full min-h-full flex-col`
	},
	theme: {
		fill: (theme) => theme("colors"),
	},
});
async function generateStyle() {
	sheet.reset();
	let content = '';

	for await (const entry of walk(".", { match: [globToRegExp("editor/**/*.{tsx,html}")] })) {
		if (entry.isFile) {
			content += await Deno.readTextFile(entry.path);
			content += `\n\n`;
		}
	}

	shim(content);
	const style = getStyleTagProperties(sheet);
	await Deno.writeTextFile(join(Deno.cwd(), 'dist/index.css'), style.textContent);
}

const result = await esbuild.build({
	entryPoints: [join(Deno.cwd(), 'editor/index.tsx')],
	outdir: 'dist',
	bundle: true,
	minify: !args.options.watch,
	metafile: false,
	sourcemap: args.options.watch ? 'inline' : false,
	watch: args.options.watch
		? {
			async onRebuild(_error, _result) {
				await generateStyle();
				// TODO HMR!
			}
		}
		: false,
	target: "esnext",
	format: "esm",
	platform: "browser",
	plugins: [BundleHttpModule],
	jsxFactory: "h",
	jsxFragment: "Fragment",
});

await generateStyle();

if (!args.options.watch) {
	Deno.exit(0);
} else {
	Deno.addSignalListener('SIGINT', () => {
		result.stop?.();
		Deno.exit(0);
	});
}