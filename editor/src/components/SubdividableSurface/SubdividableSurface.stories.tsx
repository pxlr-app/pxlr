import { SubdividableSurface } from "./SubdividableSurface";
import { createEffect, createSignal, onCleanup } from "solid-js";

export default {
	title: "Components/SubdividableSurface",
};

const Dummy = (props: { display: string }) => {
	console.log(`Dummy (${props.display})`);
	return <>{props.display}</>;
};

export const Default = () => {
	const [state, setState] = createSignal([
		{
			key: "canvas",
			x: 0,
			y: 0,
			width: 75,
			height: 100,
			props: { display: "Canvas" },
		},
		{
			key: "outline",
			x: 75,
			y: 0,
			width: 100 - 75,
			height: 50,
			props: { display: "Outline" },
		},
		{
			key: "properties",
			x: 75,
			y: 50,
			width: 100 - 75,
			height: 50,
			props: { display: "Properties" },
		},
	]);
	return (
		<div style="width: calc(100vw - 2rem); height: calc(100vh - 2rem)">
			<SubdividableSurface
				component={Dummy}
				state={state()}
			/>
		</div>
	);
};

export const SurfaceReuse = () => {
	const [split, setSplit] = createSignal(75);
	const t = setInterval(() => setSplit(Math.round(50 + Math.random() * 25)), 1000);
	onCleanup(() => clearInterval(t));

	return (
		<div style="width: calc(100vw - 2rem); height: calc(100vh - 2rem)">
			<SubdividableSurface
				component={Dummy}
				state={[
					{
						key: "canvas",
						x: 0,
						y: 0,
						width: split(),
						height: 100,
						props: { display: "Canvas" },
					},
					{
						key: "outline",
						x: split(),
						y: 0,
						width: 100 - split(),
						height: 50,
						props: { display: "Outline" },
					},
					{
						key: "properties",
						x: split(),
						y: 50,
						width: 100 - split(),
						height: 50,
						props: { display: "Properties" },
					},
				]}
			/>
		</div>
	);
};
