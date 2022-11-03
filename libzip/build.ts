import { fromFileUrl } from "https://deno.land/std@0.155.0/path/mod.ts";
import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

await emptyDir(fromFileUrl(import.meta.resolve("./npm")));

await build({
	entryPoints: [fromFileUrl(import.meta.resolve("./mod.ts"))],
	outDir: fromFileUrl(import.meta.resolve("./npm")),
	typeCheck: false,
	test: false,
	shims: {
		// see JS docs for overview and more options
		deno: false,
	},
	compilerOptions: {
		lib: [
			"dom",
			"webworker",
			"scripthost",
			"es5",
			"es2015",
			"es6",
			"es2016",
			"es2017",
			"es2018",
			"es2019",
			"es2020",
			"es2021",
			"es2022",
			"esnext",
		],
	},
	package: {
		private: true,
		name: "libzip",
		version: "0.0.0",
	},
});
