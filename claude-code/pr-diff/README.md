# pr-diff

Pane beside the chat for the current branch's PR. Run `/pr-diff`. Top bar shows number, title, state, review, checks (✓ pass ✗ fail ● pending), +/− lines and head → base. Below is the changed-file list; Enter opens that file's diff.

Needs `gh` signed in. If the `gh-accounts` skill is installed, `gh` is scoped to the repo's account.

The `Open` button (top right) opens the PR in the browser; with the pane focused, `o` presses it. `ctrl+x Tab` focuses the pane onto that button; Tab again or a click on the list gives the list the keys. Escape hands the keyboard back to the prompt.

| Key | File list | Diff |
| --- | --- | --- |
| `j` `k` `↓` `↑` | move (count: `5j`) | scroll |
| `gg` `G` | first / last (`12G` = row 12) | top / bottom |
| `ctrl-d` `ctrl-u` | half page | half page |
| `ctrl-f` `ctrl-b` | page | page |
| `H` `M` `L` | top / mid / bottom of window | |
| `Enter` `l` | open file diff | |
| `]` `[` | | next / prev hunk |
| `}` `{` | | next / prev file |
| `q` `h` `Backspace` | | back to list |
| `r` | refresh | refresh |
| `Q` | close pane | close pane |
| `O` | open PR in browser | open PR in browser |

Diffs over 40,000 characters are cut (footer says `(cut)`).
