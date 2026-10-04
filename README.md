# Aisle Be Back 🛒

A year-in-review story of your supermarket shopping history.

**Supported now:** Tesco. **Coming soon:** Sainsbury's, Asda, Morrisons, Lidl, Aldi, Co-op (see "Adding a supermarket" below).

Upload your supermarket data download (for Tesco, the `.zip` Tesco sends, or the transactions `.json` inside it). You can choose to have it remembered in your browser, so you don't need to upload it again next time. Pick **All time**, **Past 12 months** or a single year, and tap through screens covering:

- **Money & savings**: total spent, loyalty-scheme savings, average basket, biggest shop, priciest item, year-by-year chart
- **Top products**: top 5, your signature item, your biggest money pit, how many different products you bought
- **Habits & timing**: favourite day and hour, busiest month, longest gap between shops, late-night shops, cash vs card, fuel
- **Then vs now**: compared with the previous year or 12 months, new favourites, and regulars you've stopped buying
- **Price check**: how much your regular items have gone up since you first bought them
- **Fun extras**: your first ever receipt, seasons, Christmas shopping, same-day return trips, longest streak, carrier bags, Scan as you Shop, F&F clothing (kept out of the food stats)
- **Personality**: one of 14 personalities (e.g. "The Ice Cream Devotee", "The Meal Deal Legend"), a shopper type and a time-of-day badge, plus a summary card you can save or share as an image

Everything runs in the browser. The file is never uploaded to a server. If you tick "remember", it's stored only in that browser (IndexedDB), and there's a "Forget my data" button.

## Getting your Tesco data

1. Go to Tesco's [data portability page](https://www.tesco.com/account/data-portability/en-GB/), or sign in at tesco.com and open **My account → My details → Request your Tesco data**.
2. Tap **Start your request**. Tesco texts a code to your phone.
3. Tesco emails you when the download is ready (usually within a few hours, up to 48).
4. Upload the download to the site. There's no need to unzip it.

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

## Adding a supermarket

Each supermarket is one folder in `src/sources/`. To add one:

1. Get a real data file from that supermarket. Most need a formal data request (a "subject access request") to their data protection team.
2. Create `src/sources/<name>/index.tsx` exporting a `Source` (see `src/sources/types.ts`). Its `read` function turns their file into the shared `Shop` / `Item` shape in `src/lib/types.ts`. It returns `null` if a file isn't theirs.
3. In `src/sources/index.ts`, swap the supermarket's `comingSoon(...)` entry for the new source.

Everything else (stats, slides, colours) works automatically.

## Where things live

| File | What it does |
| --- | --- |
| `src/sources/` | One folder per supermarket: how to read its data, its colours, how-to steps |
| `src/lib/types.ts` | The shared shape every supermarket's data is converted into |
| `src/lib/readFile.ts` | Opens the upload (.zip, .json or .csv) and works out which supermarket it's from |
| `src/lib/storage.ts` | Remembers the data in the browser, and forgets it on request |
| `src/sources/tesco/parse.ts` | Reads the Tesco JSON and cleans it up (old receipt names, fuel, refunds) |
| `src/sources/tesco/linkNames.ts` | Links old pre-2019 till names to the full product names Tesco uses now |
| `src/lib/stats.ts` | Works out all the numbers for the chosen timeframe |
| `src/lib/extras.ts` | Price check, then vs now, habits, seasons, Christmas and carrier bags |
| `src/lib/persona.ts` | Shopping personalities and the keywords used to pick them |
| `src/slides/buildSlides.tsx` | The words and order of every story screen |
| `src/index.css` | Colours, fonts and layout |

To change the colours, edit the house colours at the top of `src/index.css`. To change the wording of a screen, edit `buildSlides.tsx`. To add a personality, add keywords and an entry in `persona.ts`.

---

A fan-made project. Not affiliated with or endorsed by any supermarket.
