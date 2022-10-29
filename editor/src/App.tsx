import type { Component } from 'solid-js';
import { createEffect, createSignal, onCleanup } from "solid-js";
import { SubdividableSurface } from "./components/SubdividableSurface";
import { Menu, MenuItem, Separator, Menubar, MenubarItem } from "./components/Menu";

const Dummy = (props: { display: string }) => {
	console.log(`Dummy (${props.display})`);
	return <>{props.display}</>;
};

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
	return (
		<Menubar>
      <MenubarItem id="file" label="File" accessKey="F">
        <Menu>
          <MenuItem
            id="newfile"
            label="New File"
            accessKey="N"
            keybind="Ctrl+N"
            action={() => console.log("click newfile")}
          />
          <MenuItem
            id="newwindow"
            label="New Window"
            accessKey="W"
            keybind="Ctrl+Shift+N"
            action={() => console.log("click newwindow")}
          />
          <Separator />
          <MenuItem
            id="openfile"
            label="Open File…"
            accessKey="O"
            keybind="Ctrl+O"
            action={() => console.log("click openfile")}
          />
          <MenuItem id="openrecent" label="Open Recent" accessKey="R" keybind="Ctrl+Shift+O">
            <Menu>
              <MenuItem
                id="reopen"
                label="Reopen Closed File"
                accessKey="R"
                keybind="Ctrl+Shift+T"
                action={() => console.log("click reopen")}
              />
              <MenuItem id="recentfiles" label="Recent Files" accessKey="F">
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
                label="Clear Recent Files"
                accessKey="C"
                action={() => console.log("click clearrecent")}
              />
            </Menu>
          </MenuItem>
          <Separator />
          <MenuItem
            id="save"
            label="Save"
            accessKey="S"
            keybind="Ctrl+S"
            action={() => console.log("click save")}
          />
          <MenuItem
            id="saveas"
            label="Save As…"
            accessKey="A"
            keybind="Ctrl+Shift+S"
            action={() => console.log("click saveas")}
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
	);
};

export default App;
