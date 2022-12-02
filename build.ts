import { Command } from "https://deno.land/x/cliffy@v0.25.1/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.15.8/mod.js";
import { apply, setup } from "https://esm.sh/v94/twind@0.16.17/";
import { getStyleTagProperties, shim, virtualSheet } from "https://esm.sh/v94/twind@0.16.17/shim/server";
import { walk } from "https://deno.land/std@0.156.0/fs/mod.ts";
import { extname, globToRegExp, join, relative } from "https://deno.land/std@0.156.0/path/mod.ts";
import { contentType } from "https://deno.land/std@0.157.0/media_types/mod.ts";
import * as ansi from "https://deno.land/x/ansi@1.0.1/mod.ts";
import * as colors from "https://deno.land/std@0.165.0/fmt/colors.ts";
import { prettyBytes } from "https://deno.land/x/pretty_bytes@v2.0.0/mod.ts";

async function build(onRebuild?: () => void) {
	await Deno.copyFile(join(Deno.cwd(), "editor/index.html"), join(Deno.cwd(), "dist/index.html"));

	const sheet = virtualSheet();
	setup({
		sheet,
		preflight: {
			"html, body": apply`w-full h-full bg-gray-900`,
			"#root": apply`flex h-full min-h-full flex-col`,
		},
		theme: {
			fill: (theme) => theme("colors"),
		},
	});
	async function generateStyle() {
		sheet.reset();
		let content = "";

		for await (const entry of walk(".", { match: [globToRegExp("editor/**/*.{tsx,html}")] })) {
			if (entry.isFile) {
				content += await Deno.readTextFile(entry.path);
				content += `\n\n`;
			}
		}

		const { warn } = console;
		Object.assign(console, { warn: () => {} });
		shim(content);
		Object.assign(console, { warn });
		const style = getStyleTagProperties(sheet);
		await Deno.writeTextFile(join(Deno.cwd(), "dist/index.css"), style.textContent);
	}

	const isDev = !!onRebuild;

	const result = await esbuild.build({
		entryPoints: [
			join(Deno.cwd(), "editor/index.tsx"),
			join(Deno.cwd(), "editor/worker.tsx"),
		],
		outdir: "dist",
		bundle: true,
		minify: !isDev,
		metafile: !isDev,
		incremental: isDev,
		treeShaking: !isDev,
		sourcemap: isDev ? "inline" : false,
		watch: isDev
			? {
				async onRebuild(_error, _result) {
					await generateStyle();
					onRebuild?.();
				},
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

	return result;
}

async function dev(port: number) {
	const startTime = performance.now();

	const _builder = await build(() => {
		for (const socket of subscribers) {
			socket.send("refresh");
		}
	});

	const listener = Deno.listen({ port });
	const subscribers = new Set<WebSocket>();

	console.log(ansi.clearScreen());
	console.log(`  ${colors.green(colors.bold(`PetiteVITE`) + ` v0.0.0`)}  ${colors.dim("ready in")} ${(performance.now() - startTime).toFixed(0)}ms`);
	console.log(``);
	console.log(`  ${colors.green("➜")}  ${colors.bold("Local")}: ${colors.blue(`http://localhost:${port}/`)}`);
	console.log(``);

	async function handleRequest(conn: Deno.Conn) {
		const http = Deno.serveHttp(conn);
		for await (const event of http) {
			const url = new URL(event.request.url);
			const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
			let response = new Response(null, { status: 404 });
			try {
				if (pathname === "/refresh") {
					const result = Deno.upgradeWebSocket(event.request);
					response = result.response;
					subscribers.add(result.socket);
					result.socket.onclose = () => {
						subscribers.delete(result.socket);
					};
				} else if (pathname === "/hmr.js") {
					let content = function () {
						const requestUrl = `${window.location.origin.replace("http", "ws")}/refresh`;
						function connect() {
							const socket = new WebSocket(requestUrl);
							socket.addEventListener("message", (e) => {
								if (e.data === "refresh") {
									console.log(`HMR RELOAD`);
									window.location.reload();
								}
							});
							socket.addEventListener("close", () => {
								setTimeout(connect, 2000);
							});
						}
						connect();
					}.toString();
					content = content.substring(13, content.length - 1);
					response = new Response(content, {
						headers: {
							"Content-Type": contentType(".js")!,
						},
					});
				} else if (pathname === "/index.html") {
					let content = await Deno.readTextFile(join(Deno.cwd(), "dist/index.html"));
					content = content.replace("</body>", '<script src="/hmr.js"></script></body>');
					response = new Response(content, {
						headers: {
							"Content-Type": contentType(".html")!,
						},
					});
				} else {
					try {
						const path = join(Deno.cwd(), "dist", pathname);
						const file = await Deno.open(path, { read: true, create: false });
						response = new Response(file.readable, {
							headers: {
								"Content-Type": contentType(extname(path)) ?? "application/octet",
							},
						});
					} catch {
						response = new Response(null, { status: 404 });
					}
				}
			} catch (error) {
				console.error(error);
				response = new Response(null, { status: 500 });
			} finally {
				// console.log(`${new Date().toISOString()} ${event.request.method} ${pathname} - ${response.status}`);
				await event.respondWith(response);
			}
		}
	}

	for await (const conn of listener) {
		handleRequest(conn).catch(console.error);
	}
}

const httpCache = await caches.open(import.meta.url);

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
			let response: Response;
			const cached = await httpCache.match(args.path);
			if (cached) {
				response = cached;
			} else {
				response = await fetch(args.path);
				httpCache.put(args.path, response.clone());
			}
			const contents = await response.text();
			const contentType = response.headers.get("Content-Type") ?? "text/javascript; charset=utf-8";
			return { contents, loader: contentType.includes("javascript") ? "jsx" : "tsx" };
		});
	},
};

await new Command()
	.name("pxlr")
	.command("build", "Build project")
	.action(async () => {
		const timeStart = performance.now();
		console.log(`${colors.green(colors.bold(`PetiteVITE`) + ` v0.0.0`)} ${colors.blue("building for production...")}`);
		const result = await build();
		console.log(colors.green("✓") + colors.dim(` ${Object.keys(result.metafile!.inputs).length} modules transformed in ${(performance.now() - timeStart).toFixed(0)}ms.`));
		const outouts: { [path: string]: { bytes: number } } = result.metafile!.outputs;
		outouts["dist/index.html"] = { bytes: (await Deno.stat(join(Deno.cwd(), "dist/index.html"))).size };
		outouts["dist/index.css"] = { bytes: (await Deno.stat(join(Deno.cwd(), "dist/index.css"))).size };
		const maxLength = Object.keys(outouts).reduce((length, key) => Math.max(length, key.length), 0);
		const sortedOutput = Object.entries(outouts);
		sortedOutput.sort((a, b) => a[0].localeCompare(b[0]));
		for (const [key, meta] of sortedOutput) {
			let color = colors.yellow;
			const ext = extname(key);
			if (ext === ".html") {
				color = colors.green;
			} else if (ext === ".css") {
				color = colors.magenta;
			} else if (ext === ".js") {
				color = colors.blue;
			}
			console.log(`${colors.dim("dist/")}${color(relative("dist/", key))}`.padEnd(maxLength + 30, " ") + colors.dim(prettyBytes(meta.bytes)));
		}
		Deno.exit(0);
	})
	.command("dev", "Launch dev server")
	.option("-p, --port <port:number>", "The port number", { default: 8000 })
	.action(({ port }) => dev(port))
	.parse(Deno.args);
