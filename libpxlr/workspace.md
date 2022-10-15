# API

```ts
const state = await workspace.checkoutBranch("main");
assert(state.isDetached === false); // state is attached to main branch
assert(state.isHead === true); // state is at head
assert(state.nextState === undefined); // no next state since were at head
assert(state.prevState !== undefined); // previous state point to parent commit

const state = await workspace.checkoutCommit("JzF21pOr54Xn0fGrhQG6");
assert(state.isDetached === true); // state is detached from a branch
assert(state.isHead === false); // not possible to be at head of a branch
assert(state.nextState === undefined); // not possible to know next state without a branch
assert(state.prevState !== undefined); // previous state point to parent commit

const state = await workspace.checkoutBranch("main", "JzF21pOr54Xn0fGrhQG6");
assert(state.isDetached === false); // state is attached to main branch
assert(state.isHead === false); // state is not at head
assert(state.nextState === undefined); // next state point to next commit based on the branch's history
assert(state.prevState !== undefined); // previous state point to parent commit
```

# Notes

- `workspace` keeps in memory cache of
  - Nodes (weakref)
  - Branches history
- `state.executeCommand`
  - creates objects
  - creates a commit
  - `state.isHead === true` update head
  - `state.isHead === false`
    - `state.isDetached === true` asks to create new branch, or auto create branch with the new commit?
    - `state.isDetached === false` asks to create new branch, or auto create branch or update head with the new commit (leaving old commit chain dangling)?
