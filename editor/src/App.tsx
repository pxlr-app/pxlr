import type { Component } from 'solid-js';
import { Menu, MenuItem, Separator, Menubar, MenubarItem } from "./components/Menu";
import { WebFile, Zip } from "libzip";

// const App: Component = () => {
//   const [state, setState] = createSignal([
// 		{
// 			key: "canvas",
// 			x: 0,
// 			y: 0,
// 			width: 75,
// 			height: 100,
// 			props: { display: "Canvas" },
// 		},
// 		{
// 			key: "outline",
// 			x: 75,
// 			y: 0,
// 			width: 100 - 75,
// 			height: 50,
// 			props: { display: "Outline" },
// 		},
// 		{
// 			key: "properties",
// 			x: 75,
// 			y: 50,
// 			width: 100 - 75,
// 			height: 50,
// 			props: { display: "Properties" },
// 		},
// 	]);
// 	return (
// 		<div style="width: calc(100vw - 2rem); height: calc(100vh - 2rem)">
// 			<SubdividableSurface component={Dummy} state={state()} />
// 		</div>
// 	);
// };
const App: Component = () => {

  const openFile = async () => {
    // console.log("click openfile");
    const [fileHandle] = await window.showOpenFilePicker({
      multiple: false,
      excludeAcceptAllOption: true,
      types: [{
        description: 'Pxlr Workspace',
        accept: {
          "*/*": ['.pxlr']
        }
      }]
    });
    const file = new WebFile(fileHandle);
    const zip = new Zip(file);
		await zip.open();
    for (const entry of zip.iterCentralDirectoryFileHeader()) {
      console.log(entry.fileName);
    }
    await zip.close();
  }

	return (
    <>
		<Menubar>
      <MenubarItem id="file" label="File" accessKey="F">
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
            action={() => console.log("click openfolder")}
          />
          <Separator />
          <MenuItem
            id="save"
            label="Save"
            accessKey="S"
            keybind="Ctrl+S"
            action={() => console.log("click save")}
          />
          <MenuItem
            id="autosave"
            label="Auto Save"
            accessKey="t"
            checked
            action={() => console.log("click autosave")}
          />
          <Separator />
          <MenuItem id="preferences" label="Preferences" accessKey="P">
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
      <MenubarItem id="edit" label="Edit" accessKey="E" />
      <MenubarItem id="selection" label="Selection" accessKey="S" />
      <MenubarItem id="view" label="View" accessKey="V" />
      <MenubarItem id="help" label="Help" accessKey="H" />
    </Menubar>
    </>
	);
};

export default App;
