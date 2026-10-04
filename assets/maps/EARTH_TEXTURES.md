# Earth globe texture provenance

Retrieved and verified 2026-10-04. The two JPEGs are unchanged copies of official NASA assets, renamed locally. They are historical visualization layers, not live weather, clinical data, or a current satellite feed. No external runtime texture requests are required.

## Day surface

- Local file: `earth-day.jpg`
- Image: Blue Marble: Next Generation, August 2004, base map with topography; global equirectangular map.
- Dimensions: 5400 × 2700 pixels, JPEG RGB.
- File size: 1,626,548 bytes.
- [Official collection and download listing](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography/).
- [Exact original image](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography/august/world.topo.200408.3x5400x2700.jpg).
- Credit: **NASA Earth Observatory; image by Reto Stöckli, NASA Goddard Space Flight Center.** The [collection credit](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/) requests credit to NASA Earth Observatory.
- SHA-256: `3dd0e487d9cc0fe5fd85c3912c3782473bd50efd9ac1b5b7edf74b3733ca18b1`

## Cloud layer

- Local file: `earth-clouds.jpg` (keeps the source JPEG format; it is not a transparent PNG).
- Image: Blue Marble: Clouds, historical composite published in 2002; combines visible-light imagery with thermal infrared imagery over the poles.
- Dimensions: 2048 × 1024 pixels, JPEG grayscale cloud intensity. Use as a material alpha map: black is transparent, white is cloud. Rotation in the scene is a visual animation, not a weather forecast.
- File size: 829,367 bytes.
- [Original NASA Visible Earth catalog record](https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/77558l). At retrieval the catalog URL redirected to the Earth Observatory landing page; its indexed official record still identified this asset and credit.
- [Exact original image, still directly available from NASA](https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg).
- Credit: **NASA Goddard Space Flight Center; image by Reto Stöckli.**
- SHA-256: `daddaad84d7a33bbbc86cdda3f591099f57cee8607b7bcf3b67eb7e4f7a1c793`

## Reuse basis

[NASA's Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) allow educational and informational uses of NASA imagery, including graphical simulations and web pages, subject to their terms. NASA imagery is generally not subject to US copyright, but the guidelines distinguish protected identifiers and third-party material. These source records credit NASA and identify no separate third-party copyright restriction. This is reuse under NASA's media guidelines, not a claim that NASA endorses this project or that all NASA website content has a blanket Creative Commons license. No NASA logo or identifiable person is included in these maps.

Recommended visible credit: **Earth imagery: NASA Earth Observatory / NASA Goddard, Reto Stöckli. Archival composites.**

## Verification

Both downloads returned valid JPEG files. The operating system image inspector confirmed the dimensions above; SHA-256 hashes and byte sizes were computed from the saved files. No resizing, recoloring, cropping, or generated image substitution was applied.
