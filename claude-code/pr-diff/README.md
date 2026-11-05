# pr-diff

Pane beside the chat for the current branch's PR. Run `/pr-diff`. Top bar shows number, title, state, review, checks (✓ pass ✗ fail ● pending), +/− lines and head → base. Below is the changed-file list; Enter opens that file's diff.

Needs `gh` signed in. If the `gh-accounts` skill is installed, `gh` is scoped to the repo's account.

Top-right buttons: `Refresh` (`r`), `Open` (`o`, PR in browser), `Close` (`c`). They are real focus stops: `ctrl+x Tab` focuses the pane and `/pr-diff` asks for focus on open. Escape closes the pane and returns the keyboard to the prompt. The nvim keys below need the list view focused: click it if they do nothing.

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
