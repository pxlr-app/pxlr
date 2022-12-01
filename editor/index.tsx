import { Fragment, h, render } from "https://esm.sh/preact@10.11.0";
import { WebFile, Zip } from "../libzip/mod.ts";
import { ZipFilesystem, BufferedRepository, Workspace, NodeRegistry, NoteNodeRegistryEntry, GroupNodeRegistryEntry, WebFilesystem, visit, VisitorResult, AutoId } from "../libpxlr/mod.ts";

function App() {
	const openFile = async () => {
		// console.log("click openfile");
		const [fileHandle] = await window.showOpenFilePicker({
			multiple: false,
			excludeAcceptAllOption: true,
			types: [
				{
					description: "Pxlr Workspace",
					accept: {
						"*/*": [".pxlr"],
					},
				},
			],
		});

		let filePermission = await fileHandle.queryPermission({ mode: "readwrite" });
		if (filePermission !== "granted") {
			filePermission = await fileHandle.requestPermission({ mode: "readwrite" });
			if (filePermission !== "granted") {
				return;
			}
		}
		const file = new WebFile(fileHandle);
		const zip = new Zip(file);
		await zip.open();
		const fs = new ZipFilesystem(zip);
		const repository = new BufferedRepository(fs);
		const nodeRegistry = new NodeRegistry();
		nodeRegistry.registerNodeConstructor(NoteNodeRegistryEntry);
		nodeRegistry.registerTreeConstructor(GroupNodeRegistryEntry);
		const workspace = new Workspace({ repository, nodeRegistry });
		// for (const entry of zip.iterCentralDirectoryFileHeader()) {
		// 	console.log(entry.fileName);
		// }
		// for await (const entry of fs.list('')) {
		// 	console.log(entry);
		// }
		// for await (const branch of workspace.listBranches()) {
		// 	console.log(branch);
		// }
		console.time("checkout from file");
		const doc = await workspace.checkoutDocumentAtBranch("main");
		console.timeEnd("checkout from file");
		console.log(doc);
		let parents: AutoId[] = [];
		visit(doc.rootNode, {
			enter(node) {
				console.log(node.id, node.kind, parents, node.name);
				parents.push(node.id);
				return VisitorResult.Continue;
			},
			leave(_) {
				parents.pop();
			}
		});
		await zip.close();
	};

	const openFolder = async () => {
		const folderHandle = await window.showDirectoryPicker({
			mode: "readwrite",
			startIn: "documents",
		});
		// for await (const entryHandle of folderHandle.values()) {
		// 	console.log(entryHandle);
		// }

		// const parts = "a/b/c/c.txt".split('/');
		// let dir = folderHandle;
		// for (let name = parts.shift(); name; name = parts.shift()) {
		// 	if (parts.length > 0) {
		// 		dir = await dir.getDirectoryHandle(name);
		// 	} else {
		// 		console.log(await dir.getFileHandle(name));
		// 	}
		// }

		const fs = new WebFilesystem(folderHandle);
		const repository = new BufferedRepository(fs);
		const nodeRegistry = new NodeRegistry();
		nodeRegistry.registerNodeConstructor(NoteNodeRegistryEntry);
		nodeRegistry.registerTreeConstructor(GroupNodeRegistryEntry);
		const workspace = new Workspace({ repository, nodeRegistry });
		console.time("checkout from folder");
		const doc = await workspace.checkoutDocumentAtBranch("main");
		console.timeEnd("checkout from folder");
		console.log(doc);
		let parents: AutoId[] = [];
		visit(doc.rootNode, {
			enter(node) {
				console.log(node.id, node.kind, parents, node.name);
				parents.push(node.id);
				return VisitorResult.Continue;
			},
			leave(_) {
				parents.pop();
			}
		});
	};

	return <div class="flex text-white">
		<button onClick={e => { openFile(); }}>Open File</button>
		<button onClick={e => { openFolder(); }}>Open Folder</button>
	</div>;
}

render(App(), document.getElementById("root")!);