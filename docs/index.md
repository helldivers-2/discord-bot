# Home!

HellCom StratDef Network, a Helldivers 2 Discord bot. This project is meant to be a utility/helper bot for any Helldivers Discords!

## Discord App Directory (Invite)

You can add HellCom to your own server via the official **[Discord App Directory (click)](https://discord.com/application-directory/1213944670288347176)**.

## Description

HellCom StratDef Network is the all-in-one solution for your Helldivers 2 server, delivering in-game updates right to your Discord! HellCom features live updates about the in-game war, easy and convenient ways to check in with the game's progress, and allows you to get notifications for any in-game event, so you can stay up to date on your fellow Helldivers' progress while you're offline!

HellCom will be continuously updated and improved. It is a community-driven project, so if there's a feature you'd like to see, feel free to suggest it in our Discord! Improvements and addition suggestions are always welcome =)

## Features

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

> Thanks for reading, have an awesome day!

If you notice any issues, or have a suggestion, feel free to contact me via Discord @`theyodastream`.

# [Terms of Service](./terms-of-service.md)

# [Privacy Policy](./privacy-policy.md)
