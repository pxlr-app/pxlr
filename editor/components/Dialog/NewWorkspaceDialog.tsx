import {
	clsx,
	createElement,
	Fragment,
	FunctionComponent,
	Icon,
	mdiCheckboxBlankCircleOutline,
	mdiCheckboxMarkedCircleOutline,
	UnstyledRadioGroup,
	useState,
} from "/editor/deps.ts";
import * as Dialog from "./Dialog.tsx";
import { Button } from "/editor/components/Button/Button.tsx";
import { Stack } from "/editor/components/Layout/Stack.tsx";
import "./NewWorkspaceDialog.css";

const settings = [
	{ id: "local-folder", name: "Local folder", description: "Stored on your device, within a specially crafted folder. Offer greatest performance." },
	{ id: "local-file", name: "Local file", description: "Stored on your device, within a zip-like file. Offer greatest portability." },
	{ id: "cloud", name: "Cloud workspace", description: "Stored on our cloud, encrypted. Offer greatest availability and security.", disabled: true },
];
export const NewWorkspaceDialog: FunctionComponent<Dialog.DialogProps> = ({ open, onClose }) => {
	const [selected, setSelected] = useState(settings[0].id);
	return (
		<Dialog.Dialog open={open} onClose={onClose}>
			<Dialog.Title>
				New workspace
			</Dialog.Title>
			<Dialog.SubTitle>
				Choose your storage
			</Dialog.SubTitle>
			<Dialog.Body>
				<UnstyledRadioGroup value={selected} onChange={setSelected}>
					<ul className="new-workspace-dialog__storages">
						{settings.map((setting, settingIdx) => (
							<UnstyledRadioGroup.Option
								key={setting.id}
								value={setting.id}
								as="li"
								disabled={!!setting.disabled}
								className={({ active, checked }) => clsx("new-workspace-dialog__storage", checked && "new-workspace-dialog__storage--checked")}
							>
								{({ active, checked }) => (
									<>
										<div>
											<UnstyledRadioGroup.Label
												as="h4"
												className="new-workspace-dialog__label"
											>
												{setting.name}
											</UnstyledRadioGroup.Label>
											<UnstyledRadioGroup.Description
												as="p"
												className="new-workspace-dialog__description"
											>
												{setting.description}
											</UnstyledRadioGroup.Description>
										</div>
										<div>
											<Icon path={checked ? mdiCheckboxMarkedCircleOutline : mdiCheckboxBlankCircleOutline} size={1} />
										</div>
									</>
								)}
							</UnstyledRadioGroup.Option>
						))}
					</ul>
				</UnstyledRadioGroup>
				<Stack justify="end">
					<Button size="extra-small">
						Create workspace
					</Button>
				</Stack>
			</Dialog.Body>
		</Dialog.Dialog>
	);
};
