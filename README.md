# MUSTHAQ — THE SERIES (plain HTML · CSS · JS)

A cinematic, streaming-inspired portfolio for **Musthaq Ahamed R** — Marketing Designer & Web Developer at JPR Exports,
Founder & Managing Director of NanoFly InfoTech, recipient of an international business trip to Malaysia.

No frameworks, no build step, no npm. Just three files you can host anywhere.

## Run it
Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000     # then visit http://localhost:8000
```

## Deploy
Drag the whole folder onto Netlify (or any static host / GitHub Pages). There is nothing to build.

## Files
```
index.html        page shell
css/styles.css    all styling (hand-written, responsive)
js/data.js        ALL content — edit this to update the site
js/main.js        rendering + interactions (opening, profiles, nav, hero, journey,
                  pinned Originals scroll, project modal, skills, achievements,
                  resume viewer, play-intro reel, cursor, particles)
js/gallery.js     GENERATED photo list (run tools/sync-images.py — don't edit by hand)
tools/            sync-images.py  → adds your photos to the site
assets/           portraits (WebP), share image, resume PDF
assets/certificates/   every certificate / letter (PDF or image) + thumbs/ previews
assets/projects/<id>/  your project photos      assets/malaysia/  trip photos
assets/icons/     gold "MA" monogram + favicon sizes (from the old portfolio's logo)
favicon.svg / favicon.ico / apple-touch-icon.png
```

## Updating content (js/data.js)
| To change… | Edit |
| --- | --- |
| Name, intro, email, phone, social links | `profile` |
| A project (add `link` for the live site) | `projects` |
| Project / Malaysia photos | drop files in `assets/projects/<id>/` or `assets/malaysia/`, then `python3 tools/sync-images.py` |
| A certificate | copy the file to `assets/certificates/`, add a thumbnail in `thumbs/`, add an entry to `certifications` (category ids are in `certCategories`) |
| Achievement photos | add `"photos": ["assets/achievements/<folder>/01.jpg", …]` to that achievement in `achievements` (shows as a clickable strip + lightbox) |
| Achievements (the one with `featured: true` becomes the Malaysia spotlight) | `achievements` |
| Certifications, skills, journey seasons, Top 10, intro reel | `certifications`, `skillCategories`, `seasons`, `topPicks`, `introSlides` |

Resume: replace `assets/Musthaq_Ahamed_Resume.pdf`.
Photo: replace `assets/portrait-*.webp` (background-removed cutout, transparent WebP).

## Notes
- Respects `prefers-reduced-motion` (parallax, grain, particles, cursor and pinned scroll switch off).
- Hover effects, tilt and the custom cursor only run on devices with a mouse; touch gets native swipe rails.
- Keyboard: `Esc` closes overlays / skips the opening; in the intro reel `Space` pauses and `← →` change slides.
- Fonts (Bebas Neue, Instrument Serif, Inter) load from Google Fonts; the site falls back to system fonts offline.

## Theme
The accent is gold (`--accent` / `--accent-2` at the top of `css/styles.css`). Change those two values to re-theme the whole site.
