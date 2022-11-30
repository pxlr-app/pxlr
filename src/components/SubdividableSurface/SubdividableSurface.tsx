import { For, JSX, ParentComponent } from "solid-js";
import { UnstyledSubdividableSurface, UnstyledSubdividableSurfaceData, UnstyledSubdividableSurfaceProps } from "./UnstyledSubdividableSurface";
import "./SubdividableSurface.css";
import { Dynamic } from "solid-js/web";

export {} from "./SubdividableSurfaceModel";

export type SubdividableSurfaceProps<T = any> = Omit<UnstyledSubdividableSurfaceProps<T>, "children"> & {
	/**
	 * Surface component
	 */
	component: (props: T) => JSX.Element;
};

export const SubdividableSurface = <T,>(props: SubdividableSurfaceProps<T>) => {
	return (
		<UnstyledSubdividableSurface {...props}>
			{({ surfaces, edges, longEdges, crosses, props: surfaceProps }) => (
				<div
					class="subdividablesurface"
					{...surfaceProps}
				>
					<For each={Object.values(surfaces)}>
						{surface => (
							<Surface surface={surface}>
								<Dynamic
									component={props.component}
									{...surface.data.props}
								/>
							</Surface>
						)}
					</For>
					<For each={edges}>{edge => <Edge edge={edge} />}</For>
					<For each={crosses}>{cross => <Cross cross={cross} />}</For>
				</div>
			)}
		</UnstyledSubdividableSurface>
	);
};

const Surface: ParentComponent<{ surface: UnstyledSubdividableSurfaceData["surfaces"][0] }> = props => {
	return (
		<div
			{...props.surface.props}
			class="subdividablesurface__surface"
			style={{
				...props.surface.props.style,
				"--ss-top-neighbor": +props.surface.data.hasNeighbors[0],
				"--ss-right-neighbor": +props.surface.data.hasNeighbors[1],
				"--ss-bottom-neighbor": +props.surface.data.hasNeighbors[2],
				"--ss-left-neighbor": +props.surface.data.hasNeighbors[3],
			}}
		>
			<div class="subdividablesurface__content">{props.children}</div>
		</div>
	);
};

const Edge = (props: { edge: UnstyledSubdividableSurfaceData["edges"][0] }) => {
	return (
		<div
			{...props.edge.props}
			class="subdividablesurface__edge"
			classList={{
				"subdividablesurface__edge--horizontal": props.edge.data.axe === "horizontal",
				"subdividablesurface__edge--vertical": props.edge.data.axe === "vertical",
			}}
		/>
	);
};

const Cross = (props: { cross: UnstyledSubdividableSurfaceData["crosses"][0] }) => {
	return (
		<div
			{...props.cross.props}
			class="subdividablesurface__cross"
		/>
	);
};
