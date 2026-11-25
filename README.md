# Jenifer's World

**[jwinn19464.github.io](https://jwinn19464.github.io)** · Portfolio of Jenifer Nguyen, a computer science graduate student focused on data science, AI safety and interpretability

This portfolio is built as a small world you explore. A starlit home base holds nine glowing portals, and each one opens an area of my work: research, computer vision, food projects, learning tools, skills, music, writing, and a way to get in touch. Inside each area, the projects are "memories" you open to read. Memories marked **PLAY** open working apps right on the page.

The idea comes from the PowerPoint museums I used to build, where rooms were linked together with clickable shapes.

---

## What's inside

| Area | What you'll find |
|---|---|
| **Where It Began** | Tutoring, teaching a summer camp in Guatemala, first steps into AI safety |
| **The Observatory** | Published research on hypergraph attention networks for molecules, interpretability work, and a multi-agent trust simulation |
| **The Prism** | Computer vision coursework: camera calibration, Fourier-domain filtering, segmentation, optical flow, stereo |
| **The Kitchen** | Fridge Oracle (a computer vision pipeline that reads expiration dates and plans meals) and DealDish |
| **The Playground** | DerivativeLab and a CS-concepts platformer |
| **Inventory** | Skills and where I've used them |
| **The Music Room** | Choir, piano, and a keyboard you can play |
| **The Journal** | Writing in progress |
| **Get in Touch** | Contact |

### Playable demos
Every demo runs entirely in your browser, with no server:

- **DerivativeLab:** drag along a curve to see its tangent line and derivative
- **Fridge Oracle:** ranks recipes by how much soon-to-expire food they use
- **DealDish:** builds a basket from grocery deals and suggests recipes
- **Key-Trading Game:** a simulation of trust, defection and forged messages among agents
- **CS Adventure:** a short platformer where each coin is a computer science concept
- **Computer vision:** measuring objects in a photo, Gaussian blur and the kernel-size rule, and classical foreground segmentation (you can try the last two on your own photos)

---

## How it's built

- **Plain HTML, CSS and JavaScript**, with no framework and no build step
- **Content-driven:** every word, area, memory and photo path lives in `content.json`, and the page renders itself from that file
- **Canvas graphics:** each portal is drawn pixel by pixel on its own canvas, with drifting rings, a soft halo and rising sparkles. The night sky is a full-page canvas animation.
- **Light and dark themes** built on CSS custom properties, following your system setting, with a toggle
- **Accessible by design:** keyboard navigation, visible focus states, and animations that stop when your device asks for reduced motion
- **Plain mode:** one click switches to a simple résumé view
- **Built-in editor:** a private, token-protected editor lets the site owner change content visually and save it back to this repository through the GitHub API

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `content.json` | All site content |
| `style.css` | Styling and themes |
| `main.js` | Rendering, portals, areas, demos and achievements |
| `admin.js` | The owner-only editor |

## Run it locally

Clone the repository and serve the folder with any local web server, for example:

```bash
python -m http.server
```

Then open `http://localhost:8000`. Opening `index.html` directly from disk won't work, because browsers block a local file from loading `content.json`.

In VS Code, the **Live Server** extension does the same thing with one click.

---

© Jenifer Nguyen. All rights reserved. The code and content in this repository are shared for viewing, not for reuse.
