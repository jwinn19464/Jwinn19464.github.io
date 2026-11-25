# Jenifer's World

## Files

| File | What it holds |
|---|---|
| `index.html` | Page structure: top bar, intro, profile card, the world frame, footer |
| `content.json` | **All the content**: intro text, profile rows, areas, memories, contact link, live-app links, photo paths |
| `style.css` | All styling. Light and dark colours are CSS variables at the top |
| `main.js` | Draws the page from `content.json`: night sky, portals, areas, memories, demo apps, achievements |
| `admin.js` | The hidden login (voice + GitHub) and the visual editor |
| `images/` | Created automatically the first time you upload a photo through the editor |

## Run it on your computer (VS Code)

1. Open the folder in VS Code with **File → Open Folder**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` and choose **Open with Live Server**.

Double-clicking `index.html` won't work, because browsers block a plain file from reading `content.json`.

## Put it online (GitHub Pages)

1. Create a repository named **`your-username.github.io`** and upload the six files in this folder. All of them sit at the top level, so you can select them in one go, even from a phone's browser.
   With that exact name, the site appears at `https://your-username.github.io`. Your other repositories' Pages sites will also appear under the same domain (for example `/cv-modules`).
2. In the repository, go to **Settings → Pages** and publish from the `main` branch, `/ (root)` folder.
3. Custom domain (optional): buy one, enter it under **Settings → Pages → Custom domain**, add the DNS records GitHub lists, then tick **Enforce HTTPS** once the check passes.

## Edit the site visually (desktop or phone)

### One-time setup: make a token
1. On GitHub, go to **Settings → Developer settings → Fine-grained tokens → Generate new token**.
2. Under **Repository access**, choose **Only select repositories** and pick your site's repository.
3. Under **Permissions → Repository permissions**, set **Contents** to **Read and write**.
4. Copy the token. Treat it like a password: never put it in a file or commit it.

### Signing in
1. On your live site, click (or tap) your name **5 times**.
2. **First time on a device:** enter your repository (`your-username/your-username.github.io`) and the token. Leave "Remember me" on if it's your own device.
3. You'll be offered **voice login** for that device: say "Open my world" three times. Next time, the 5 clicks open a voice check first. Your voiceprint stays in that browser only and is never uploaded.

The voice check is a fun gate, not the real lock. Anyone who views the code could skip it, and voices can be imitated. The real lock is GitHub: nothing saves without a token that can write to your repository.

### Editing
- **Text:** click any text with a dashed outline and type. Press Enter to finish.
- **A memory:** click it to open its panel (title, year, tools, description, bullets, icon, link, app, photo, which area it's in). **Delete** asks you to click twice.
- **Reorder:** drag the **⠿** handle on a memory or portal. On a phone, press and drag the handle. You can also use **Move earlier / Move later** in a memory's panel.
- **Add:** use the **+ Add memory** and **+ Add area** tiles.
- **Area settings:** portal label, title, subtitle, colour, or delete the area.
- **Photos:** use **Add photo** in a memory's panel, or click your portrait. Photos are shrunk in the browser and committed to `images/` right away.
- **Settings** (toolbar): LinkedIn link, profile rows, Plain-mode résumé lines, live-app links, footer, voice login on this device.
- **Save** writes `content.json` back to GitHub. The live site updates about a minute later.
- **Discard** goes back to the last saved version. Unsaved edits are also kept in your browser, so if a tab closes, the toolbar offers **Restore unsaved draft** next time.

## Editing the code on a phone or tablet
- In your repository on GitHub, press `.` (or change `github.com` to `github.dev` in the address) to open a browser version of VS Code. It works best on a tablet.
- The GitHub mobile app can also edit single files.

## Live apps behind portals
A memory opens an app if it has `"app"` (one of the built-in demos in `main.js`: `derivative`, `fridge`, `dealdish`, `keygame`, `platformer`, `blur`, `measure`, `segment`) or `"live"` (a key in `content.json → live`).

Add deployed links in **Settings → Live app links**:
- Streamlit Community Cloud links get `?embed=true` added automatically.
- Apps hosted as their own GitHub Pages sites work too, such as Streamlit apps converted with stlite.

The **Live app** tab stays hidden from visitors until it has a link.
