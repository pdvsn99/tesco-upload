# Tesco Wrapped 🛒

A Spotify Wrapped-style story of your Tesco shopping history.

Upload the transactions `.json` file from your Tesco data download. Pick **All time**, **Past 12 months** or a single year, and tap through screens covering:

- **Money & savings**: total spent, Clubcard savings, average basket, biggest shop, priciest item, year-by-year chart
- **Top products**: top 5, your signature item, your biggest money pit, how many different products you bought
- **Habits & timing**: favourite day and hour, busiest month, longest gap between shops, late-night shops, cash vs card, fuel
- **Personality**: e.g. "The Ice Cream Devotee", plus a summary card you can save or share as an image

Everything runs in the browser. The file is never uploaded to a server.

## Running it on your computer

You need [Node.js](https://nodejs.org) installed (the "LTS" version).

```bash
npm install     # one time only: downloads the libraries
npm run dev     # starts the site. Open the link it prints (usually http://localhost:5173)
```

## Putting it online

```bash
npm run build   # creates a `dist` folder with the finished website
```

Upload the `dist` folder to any static host. The easiest options are:

- **Netlify Drop**: drag the `dist` folder onto https://app.netlify.com/drop
- **Vercel**: import this GitHub repo and accept the defaults

## Where things live

| File | What it does |
| --- | --- |
| `src/lib/parse.ts` | Reads the Tesco JSON and cleans it up (old receipt names, fuel, refunds) |
| `src/lib/stats.ts` | Works out all the numbers for the chosen timeframe |
| `src/lib/persona.ts` | Shopping personalities and the keywords used to pick them |
| `src/slides/buildSlides.tsx` | The words and order of every story screen |
| `src/index.css` | Colours, fonts and layout |

To change the wording of a screen, edit `buildSlides.tsx`. To add a personality, add keywords and an entry in `persona.ts`.

---

A fan-made project. Not affiliated with or endorsed by Tesco.
