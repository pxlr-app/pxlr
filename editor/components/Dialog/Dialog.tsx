import { clsx, createElement, Fragment, FunctionComponent, Icon, PropsWithChildren, Transition, UnstyledDialog } from "/editor/deps.ts";
import "./Dialog.css";

export type DialogProps = {
	open: boolean;
	onClose: (value: boolean) => void;
};

export const Dialog: FunctionComponent<PropsWithChildren<DialogProps>> = ({ open, onClose, children }) => {
	return (
		<Transition appear show={open} as={Fragment}>
			<UnstyledDialog as="div" className="dialog" onClose={onClose}>
				<Transition.Child
					as={Fragment}
					enter="dialog__backdrop--enter"
					enterFrom="dialog__backdrop--enterFrom"
					enterTo="dialog__backdrop--enterTo"
					leave="dialog__backdrop--leave"
					leaveFrom="dialog__backdrop--leaveFrom"
					leaveTo="dialog__backdrop--leaveTo"
				>
					<div className="dialog__backdrop"></div>
				</Transition.Child>

				<div className="dialog__scroller">
					<div className="dialog__container">
						<Transition.Child
							as={Fragment}
							enter="dialog__panel--enter"
							enterFrom="dialog__panel--enterFrom"
							enterTo="dialog__panel--enterTo"
							leave="dialog__panel--leave"
							leaveFrom="dialog__panel--leaveFrom"
							leaveTo="dialog__panel--leaveTo"
						>
							<UnstyledDialog.Panel className="dialog__panel">
								{children}
							</UnstyledDialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</UnstyledDialog>
		</Transition>
	);
};

export const Title: FunctionComponent<PropsWithChildren> = ({ children }) => {
	return (
		<UnstyledDialog.Title as="h2" className="dialog__title">
			{children}
		</UnstyledDialog.Title>
	);
};

export const SubTitle: FunctionComponent<PropsWithChildren> = ({ children }) => {
	return (
		<h3 className="dialog__subtitle">
			{children}
		</h3>
	);
};

export const Body: FunctionComponent<PropsWithChildren> = ({ children }) => {
	return (
		<div className="dialog__body">
			{children}
		</div>
	);
};
