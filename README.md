# Jellyfin MediaInfo Ratings Enhanced & Customizable

Designed for Jellyfin Web version via JavaScript Inject: Enhances the Jellyfin MediaInfo ratings section with extended multi-source support, flexible configuration, optional UI fixes, and positional control for internal and external ratings.

This modification is based on @Druidblack’s (https://github.com/Druidblack/jellyfin_ratings) both Version 1 original scripts and extends it with independent feature toggles, configurable source ordering, rating limits, optional layout adjustments, and more. It supports repositioning of the “Ends at” display for movies as well as flexible internal and external ratings placement for both movies and TV shows.

@Druidblack originally provided four separate script variants: Version 1 and Version 2, each available in both “basic” (window.fetch) and “user” (GM_xmlhttpRequest) modes. For stability, maintainability, and structural consistency reasons, this modification is built exclusively on Version 1.
Rather than maintaining separate basic and user editions, this script combines both network approaches into a single unified implementation. The desired mode can be selected via configuration, allowing seamless switching between standard fetch requests and GM_xmlhttpRequest without requiring separate script files.

---

## Features

- Adds external ratings from multiple sources (IMDb, TMDB, Rotten Tomatoes, Metacritic, Trakt, Letterboxd, MyAnimeList, etc.).  
- Independent enable/disable toggles for each external rating source.  
- Configurable rating limits (max number of ratings shown).  
- Fully customizable source ordering for display priority.  
- Optional fixes and UI adjustments to integrate seamlessly with Jellyfin’s native layout.  
- Flexible positioning of the “Ends at” element on movies.  
- Configurable placement of internal (star + critic) and external ratings for movies and series.  
- Smart caching to reduce API calls and improve performance.  
- Works with both built-in Jellyfin ratings and external MDBList data.

---

## Installation

This script is intended for use with Jellyfin Web.

1. Install a JavaScript injector plugin (e.g., Jellyfin JavaScript Injector plugin or a userscript manager such as Tampermonkey/Violentmonkey).  
2. Create a new script and paste the contents of `Jellyfin-MediaInfo-Ratings-Enhanced.js` into the injector.  
3. Adjust the configuration section at the top of the script to your needs (API key, enabled sources, UI behavior).  
4. Save and reload the Jellyfin Web interface.

---

## Configuration

The script includes an extensive configuration section at the top:

- **Global mode**: Choose between basic fetch or user mode (GM_xmlhttpRequest).  
- **API key**: Set your MDBList API key.  
- **Debug logging**: Enable or disable detailed console output.  
- **Polling triggers**: Control how often the script scans for new TMDB links.  
- **Cache settings**: Enable in-memory cache and set TTL.  
- **Source toggles**: Enable or disable individual rating sources.  
- **Display settings**: Adjust internal and external rating visibility, order, new line behavior, and positioning of the “Ends at” element for movies.

Review the top of the script file for detailed comments on each option.

---

## Tested On

- Jellyfin Web 10.10.7
- Google Chrome
- Windows 11

---

## License

MIT
