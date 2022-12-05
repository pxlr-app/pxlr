import { h } from "/editor/deps.ts";
import { WebFile, Zip } from "/libzip/mod.ts";
import {
	AutoId,
	BufferedRepository,
	GroupNodeRegistryEntry,
	NodeRegistry,
	NoteNodeRegistryEntry,
	visit,
	VisitorResult,
	WebFilesystem,
	Workspace,
	ZipFilesystem,
} from "/libpxlr/mod.ts";
import { Menu, MenuItem, Menubar, MenubarItem, Separator } from "/editor/components/Menu/mod.ts";
import "/editor/App.css";

export default function App() {
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
		const parents: AutoId[] = [];
		visit(doc.rootNode, {
			enter(node) {
				console.log(node.id, node.kind, parents, node.name);
				parents.push(node.id);
				return VisitorResult.Continue;
			},
			leave(_) {
				parents.pop();
			},
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
		const parents: AutoId[] = [];
		visit(doc.rootNode, {
			enter(node) {
				console.log(node.id, node.kind, parents, node.name);
				parents.push(node.id);
				return VisitorResult.Continue;
			},
			leave(_) {
				parents.pop();
			},
		});
	};

	return (
		<div class="flex flex-row text-white">
			<Menubar>
				<MenubarItem
					id="file"
					label="File"
					accessKey="F"
				>
					<Menu>
						<MenuItem
							id="newdoc"
							label="New Document"
							accessKey="N"
						>
							<Menu>
								<MenuItem
									id="newpxlrfile"
									label="New File…"
									accessKey="N"
									keybind="Ctrl+N"
									action={() => console.log("click newpxlrfile")}
								/>
								<MenuItem
									id="newpxlrfolder"
									label="New Folder…"
									accessKey="F"
									keybind="Ctrl+Shift+N"
									action={() => console.log("click newpxlrfolder")}
								/>
							</Menu>
						</MenuItem>
						<Separator />
						<MenuItem
							id="opendoc"
							label="Open Document"
							accessKey="O"
						>
							<Menu>
								<MenuItem
									id="openfile"
									label="Open File…"
									accessKey="O"
									keybind="Ctrl+O"
									action={openFile}
								/>
								<MenuItem
									id="openfolder"
									label="Open Folder…"
									accessKey="F"
									keybind="Ctrl+Shift+O"
									action={openFolder}
								/>
							</Menu>
						</MenuItem>
						<MenuItem
							id="openrecent"
							label="Open Recent"
							accessKey="R"
						>
							<Menu>
								<MenuItem
									id="reopen"
									label="Reopen Closed Document"
									accessKey="R"
									keybind="Ctrl+Shift+T"
									action={() => console.log("click reopen")}
								/>
								<MenuItem
									id="recentdocs"
									label="Recent Documents"
									accessKey="D"
								>
									<Menu>
										<MenuItem
											id="filea"
											label="File A"
											accessKey="A"
											action={() => console.log("click filea")}
										/>
										<MenuItem
											id="fileb"
											label="File B"
											accessKey="B"
											action={() => console.log("click fileb")}
										/>
										<MenuItem
											id="filec"
											label="File C"
											accessKey="C"
											action={() => console.log("click filec")}
										/>
									</Menu>
								</MenuItem>
								<MenuItem
									id="clearrecent"
									label="Clear Recent Documents"
									accessKey="C"
									action={() => console.log("click clearrecent")}
								/>
							</Menu>
						</MenuItem>
						<Separator />
						<MenuItem
							id="saveas"
							label="Save As"
							accessKey="A"
						>
							<Menu>
								<MenuItem
									id="saveaspxlrfile"
									label="Save As File…"
									accessKey="S"
									action={() => console.log("click saveaspxlrfile")}
								/>
								<MenuItem
									id="saveaspxlrfolder"
									label="Save As Folder…"
									accessKey="F"
									action={() => console.log("click saveaspxlrfolder")}
								/>
							</Menu>
						</MenuItem>
						<Separator />
						<MenuItem
							id="preferences"
							label="Preferences"
							accessKey="P"
						>
							<Menu>
								<MenuItem
									id="settings"
									label="Settings"
									accessKey="S"
									keybind="Ctrl+,"
									action={() => console.log("click settings")}
								/>
								<MenuItem
									id="keyboardshortcuts"
									label="Keyboard Shortcuts"
									accessKey="K"
									action={() => console.log("click keyboardshortcuts")}
								/>
							</Menu>
						</MenuItem>
						<MenuItem
							id="useraccount"
							label="User Account"
							accessKey="U"
							action={() => console.log("click useraccount")}
						/>
					</Menu>
				</MenubarItem>
				<MenubarItem
					id="edit"
					label="Edit"
					accessKey="E"
				/>
				<MenubarItem
					id="selection"
					label="Selection"
					accessKey="S"
				/>
				<MenubarItem
					id="view"
					label="View"
					accessKey="V"
				/>
				<MenubarItem
					id="help"
					label="Help"
					accessKey="H"
				/>
			</Menubar>
		</div>
	);
}
