import { createContext } from "/editor/deps.ts";
import EditorState from "./EditorState.ts";

export default createContext<EditorState>(new EditorState());