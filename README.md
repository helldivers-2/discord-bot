# HellCom

This is the repo for the Discord bot HellCom StratDef Network, a Helldivers 2 community bot. This project is meant to be a utility/helper bot for any Helldivers Discords!

HellCom features live updates about the in-game war, easy and convenient ways to check in with the game's progress, and allows you to get notifications for any in-game event, so you can stay up to date on your fellow Helldivers' progress while you're offline!

HellCom will be continuously updated and improved. It is a community-driven project, so if there's a feature you'd like to see, feel free to suggest it in our Discord! Improvements and addition suggestions are always welcome =)

You can add it to your own server using **[this link (click)](https://discord.com/application-directory/1213944670288347176)**.

## Commands

<details open>
  <summary>Discord Slash Commands </summary>

- `/campaign`: Campaign-related information (playable planets)
  - `/campaign list`: Gives an overview of all currently active planets with some stats for each one
  - `/campaign most`: Gives an overview of the campaign with the most active players
  - `/campaign info <PLANET_NAME>`: Gives an overview of a campaign on a _specified_ planet. Has automcomplete for active campaigns
- `/community`: Highlights other community projects with a description and link(s)
- `/discord`: Information about HellCom's partnered/support server, as well as support links (eg. donations, voting)
- `/dispatches`: Shows a list of in-game dispatch messages with timestamps
- `/events`: In-game ""events"" -- kind of outdated, this was made before the NewsFeed API existed
  - `/events all`: Shows all active events
  - `/events latest`: Shows the most recent event
- `/history`: Shows historical data, currently via line graphs
  - `/history players`: Generates a graph for historical player counts (per faction, and total)
- `/map`: Generates galactic maps dynamically!
  - `/map galaxy`: Shows an image of the entire galaxy with planets mapped onto it -- names are shown for planets we don't control
  - `/map planet <PLANET_NAME>`: Similar to above, but zooms in on a specified planet -- additionally shows campaign info (players, lib%)
- `/planet`
  - `/planet list`: (Gotta move this) Shows a summary of the current in-game status such as campaigns (+progress) and major order (if there is one)
  - `/planet info <PLANET_NAME>`: Shows some information about a specified planet -- not limited to active campaigns
- `/subscribe`
  - `/subscribe event`: Allows users to "subscribe" a channel to event updated. The bot will then post updates about the war in that channel as it happens -- stuff like winning (or losing!) a campaign, getting access to a new planet, new dispatch messages, new major orders.
  - `/subscribe status`: Sends a message in the channel the command was used, displays summary information (identical to `/planet list`) and will update after certain intervals automatically.

</details>

If you notice any issues, or have a suggestion, feel free to contact me via Discord @`theyodastream`.

## Contributing

### Wiki Source

The `/wiki` command uses JSON files as the source for its "categories" and "pages", found in [this directory](./wiki/). The aim is to allow people who aren't familiar with programming to still contribute, as it is mostly just text fields. To add/change/remove categories/pages, only the JSON files need to be modified.

```txt
root
├── src
│   └── ...
└── wiki
    ├── index.json
    ├──  automatons
    │   └── berserker.json
    │   └── ... other json files (pages)
    ├─── terminids
    │   └── bile_titan.json
    │   └── ... other json files (pages)
    └── ... other folders (categories)
```

`index.json` root file. This file defines the categories and related information (eg. display name, emoji, description, etc.)

```json
[
  // Example, filled out categories page
  {
    "directory": "eagles",
    "display_name": "Eagles",
    "content": "As a commander of a Destroyer, you can call in an Eagle to provide air support. Eagle call-ins are quite fast, having little to no call-in times, making them a versatile choice for your loadout.\n\nEagles have a certain number of uses per re-arm, after which it returns to the Super Destroyer for an extended period to resupply before coming back online. The number of uses varies depending on the types selected, with chaff-clearers (such as Clusters, or Strafing) having a higher number of uses, while heavy-hitters (such as the 500KG Bomb) tend to have fewer uses.",
    "fields": [
      {
        "name": "Base Rearm Time",
        "value": "150 seconds",
        "inline": false
      }
    ],
    "emoji": "<:eagle_strafing_run:1220789245724065792>",
    "thumbnail": "https://xywpvislkizlfztycqhf.supabase.co/storage/v1/object/public/hellcom/stratagems/eagle_strafing_run.png",
    "image": "https://cdn.discordapp.com/attachments/1220852151769894993/1220852308833992866/eagle_fly_in.gif?ex=66107250&is=65fdfd50&hm=e41f85c2cc8a4b76ed5522658336380a39a004d2236142711b85203207241643&"
  },
  // JSON structure
  {
    // defining a category, each item in the index.json arr is a category
    "directory": "", // relative directory name, used to load json pages
    "display_name": "", // display name of the category, should be pretty -- include caps, spaces
    "content": "", // text content on the category page, supports discord markdown
    "fields": [
      // discord embed fields,
      {
        "name": "", // title of a field, bolded
        "value": "", // contents of the field, supports discord markdown
        "inline": true // bool val for displaying this field in-line with others
      }
    ],
    "emoji": "", // discord emoji, to display as the icon when selecting a category
    "thumbnail": "", // image to show at the top left, smaller image
    "image": "" // image to show as the bottom, primary image
  }
]
```

Individual page JSON file. Located within each category directory. An example ~completed file can be found at [here](./wiki/terminids/bile_titan.json).

```json
// JSON structure
{
  "page": "", // page id, lowercase, no spaces, must be unique
  "title": "", // display name of the category, should be pretty -- include caps, spaces
  "description": "", // short description shown when selecting a page
  "content": "", // text content on the category page, supports discord markdown
  "fields": [
    // discord embed fields,
    {
      "name": "", // title of a field, bolded
      "value": "", // contents of the field, supports discord markdown
      "inline": true // bool val for displaying this field in-line with others
    }
  ],
  "emoji": "", // discord emoji, to display as the icon when selecting a category
  "thumbnail": "", // image to show at the top left, smaller image
  "image": "" // image to show as the bottom, primary image
}
```

TODO: add image examples

## Development

Styled with [![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)  
Created with [![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)[![Static Badge](https://img.shields.io/badge/discord.js-0a168d?style=for-the-badge)](https://discord.js.org/)  
Postgres DB on [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)  
Logging/Metrics with [![Static Badge](https://img.shields.io/badge/New%20Relic-2fdd88?style=for-the-badge)](https://newrelic.com/platform)  
Deployed with ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)

Container images are built via [GitHub Actions](/.github/workflows/build.yml) and uploaded to GitHub Container Registry (this repo's GHCR).  
GH Actions also handles semantic versioning using commit message substrings, saving them as GitHub tags (eg. `v0.0.30):

- `#skip-ci`: Skips the workflow completely; Useful if changing things unrelated to code (eg. README)
- `#none`: Builds new image, but with no semver change (eg. `v1.2.3` -> `v.1.2.3`)
- `#patch`: Increments patch version (eg. `v1.2.3` -> `v.1.2.4`)
- `#minor`: Increments minor version (eg. `v1.2.3` -> `v.1.3.3`)
- `#major`: Increments major version (eg. `v1.2.3` -> `v.2.2.3`)
  > If omitted, GHA will default to `none` (building image, no semver change).

When building the image, this semver is included in the image and can be safely used. The version in [package.json](./package.json) is not used.

### Local Development

To set things up:

```shell
# Clone the repository locally
git clone https://github.com/helldivers-2/discord-bot.git
cd helldivers2-bot
# Install dependencies
npm install
```

To run the bot locally (or when deploying), you'll need some env vars:

- `BOT_TOKEN` - Discord bot token, gotten from [Discord's developer portal](https://discord.com/developers/applications) (for more info, see [their docs](https://discord.com/developers/docs/intro))
- `DATABASE_URL` - PostgreSQL database connection string
- `NEW_RELIC_APP_NAME` - Display name for New Relic logs
- `NEW_RELIC_LICENSE_KEY` - New Relic API Key (type: INGEST-LICENSE)
- `NODE_ENV` - "development" or "production"

Running the application (watch mode)

```shell
npm run watch
```

You can view the Database locally via [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview). Ensure `DATABASE_URL` is set up, per above.

```shell
npx drizzle-kit studio
```

Building the application locally, or a Docker image:

```shell
# Build locally
npm run build
# Build Docker image
docker build . -t hellcom:latest
```

More documentation to come as I remember/verify things.

> Thanks for reading, have an awesome day!
