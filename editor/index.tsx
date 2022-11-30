import { Fragment, h, render } from "https://esm.sh/preact@10.11.0";

function App() {
	return <div class="flex">
		<button onClick={e => console.log(e)}>Foobar</button>
	</div>;
}

render(App(), document.getElementById("root")!);