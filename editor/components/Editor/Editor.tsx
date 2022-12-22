import {
	createElement,
	Fragment,
	Icon,
	mdiAccount,
	mdiArtboard,
	mdiChartLineVariant,
	mdiCircle,
	mdiCogOutline,
	mdiCursorDefault,
	mdiEraser,
	mdiExportVariant,
	mdiFileDocumentPlusOutline,
	mdiFolderOutline,
	mdiFormatColorFill,
	mdiHelpCircleOutline,
	mdiMenu,
	mdiPackageVariantClosed,
	mdiPencilOutline,
	mdiRectangle,
	mdiRedo,
	mdiTagPlusOutline,
	mdiUndo,
	useState,
} from "/editor/deps.ts";
import { Button, ButtonGroup } from "/editor/components/Button/mod.ts";
import * as Menu from "/editor/components/Menu/Menu.tsx";
import { Stack } from "/editor/components/Layout/mod.ts";
import { NewWorkspaceDialog, OpenWorkspaceDialog } from "/editor/components/Dialog/mod.ts";
import { EditorContext, EditorState } from "/editor/components/Editor/mod.ts";

export default function Editor() {
	const [newOpened, setNewOpen] = useState(false);
	const [openOpened, setOpenOpen] = useState(false);
	const [state, updateState] = useState<EditorState>(() => new EditorState());
	return (
		<EditorContext.Provider value={state}>
			<Stack direction="horizontal">
				<Menu.Menu>
					<Menu.Button>
						<Button>
							<Icon path={mdiMenu} size={0.65} />
						</Button>
					</Menu.Button>
					<Menu.Items>
						<Menu.Item label="New..." keybind="CTRL+N" icon={mdiFileDocumentPlusOutline} onAction={() => setNewOpen(true)} />
						<Menu.Item label="Open..." keybind="CTRL+O" icon={mdiFolderOutline} onAction={() => setOpenOpen(true)} />
						<Menu.Separator />
						<Menu.Item label="Tag..." keybind="CTRL+S" icon={mdiTagPlusOutline} />
						<Menu.Item label="Save as..." keybind="CTRL+SHIFT+S" icon={mdiPackageVariantClosed} />
						<Menu.Item label="Export..." keybind="CTRL+SHIFT+E" icon={mdiExportVariant} />
						<Menu.Separator />
						<Menu.Item label="Preferences..." keybind="CTRL+," icon={mdiCogOutline} />
						<Menu.Item label="Help" keybind="F1" icon={mdiHelpCircleOutline} />
					</Menu.Items>
				</Menu.Menu>
				<ButtonGroup>
					<Button>
						<Icon path={mdiCursorDefault} size={0.65} />
					</Button>
					<Button>
						<Icon path={mdiArtboard} size={0.65} />
					</Button>
				</ButtonGroup>
				<Button>
					<Icon path={mdiAccount} size={0.65} />
				</Button>
				<NewWorkspaceDialog open={newOpened} onClose={setNewOpen} />
				<OpenWorkspaceDialog open={openOpened} onClose={setOpenOpen} />
			</Stack>
		</EditorContext.Provider>
	);
}