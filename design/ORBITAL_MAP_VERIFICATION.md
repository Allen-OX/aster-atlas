# Orbital map — browser verification

October 4, 2026. Public Aster Atlas geography enhancement inspired by the user's supplied globe/HUD reference. No reference branding, private dataset, location feed, or reference threat indicators were imported.

## Implemented

- Orbitable textured Earth and independently selectable flat map over the same 177 Natural Earth features.
- Local NASA day texture and separate archival grayscale cloud alpha map. CPU image decode downsizes the day texture to a bounded 4096×2048 GPU texture; original downloaded file stays unchanged.
- Camera-oriented visualization lighting, atmospheric rim, borders, graticule, decorative stars, optional automatic rotation and global pause/speed integration.
- Country search/select, click selection, double-click focus, keyboard arrows/Enter/Home, dolly zoom, touch orbit/pinch, country highlights and selected-geography lens.
- Separate cloud/border/grid/atmosphere switches, connected-universe links and original source attribution.
- Offscreen/inactive render suspension, WebGL lifecycle handling, disposal, flat-map fallback and visible failed-imagery notice.

## Executed browser checks

Chrome on the user's Mac:

1. Globe mode loaded both local imagery layers. Diagnostics reported 177 features, day texture 4096×2048 and cloud alpha texture 2048×1024. Current browser load had no console errors.
2. Germany focus showed the selected country border aligned over Europe. Australia and Japan selections updated the selected country, continent, source code and camera destination.
3. Direct canvas click selected Niger. ArrowRight followed by Enter selected Sudan; recorded center pick approximately 33.244°E, 19.145°N, consistent with the selected geometry.
4. Repeated plus reached the physical camera bound (2.7× in this desktop viewport) and disabled the button. Flat mode retained Australia selection; switching back restored the globe. The flat-map Japan check reached its separate 12× limit.
5. Typed Brazil search selected Brazil. Cloud and grid buttons changed their diagnostic layer state. Reset returned the orbital home view.
6. At 390×844 responsive viewport, country search and layers remained operable. Initial 7px page overflow traced to the expanded main navigation; after correction the document width and scroll width were both 375px. Japan detail remained readable after adjusting visualization lighting for the far hemisphere. Temporary viewport override was reset.
7. One visible desktop diagnostics sample with clouds disabled recorded 7 draw calls, 18,112 triangles, 7 geometries, 3 textures, 180 frame samples, median 8.3ms and p95 9.1ms. This is one local measurement, not a device-independent frame-rate guarantee.

The independent acceptance reviewer separately checked 63 coordinate round trips, 10 country fixtures, oceans/invalid latitude and three synthetic seam/hole fixtures. Their evidence is recorded in ORBITAL_MAP_ACCEPTANCE.md. Scene-author mock-renderer lifecycle checks are separate from browser execution.

## Limitations

The imagery is archival, clouds are decorative, and lighting is selected for readability rather than a live solar terminator. Country outlines are 1:110m geographic overviews; there are no street-level tiles or inferred patient/trial/care-site coordinates. Globe camera bounds depend on responsive framing; they are not a claim of satellite-scale detail. The application does not become a live intelligence service by displaying an Earth visualization.
