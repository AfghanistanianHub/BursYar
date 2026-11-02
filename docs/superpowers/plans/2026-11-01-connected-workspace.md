# Connected scholarship workspace

Goal: port the approved MagicPath workspace into the existing vanilla-JavaScript application without replacing authentication, source approval or evidence workflows.

Design reference: desktop component 467709203071508480 revision 467712587358961664; mobile component 467710391615655936 revision 467713526178414592. Adapt layout and restrained slate/paper palette, not synthetic profile controls or fake analysis.

- [ ] Normalize country facets, preserving original research metadata and uncertain regional coverage. Test multi-country membership and avoid claiming a complete regional country list.
- [ ] Add localized workspace overview and direct profile/source/discovery actions. Retain existing mount IDs and native disclosure behavior.
- [ ] Connect research cards to source preparation without fetching or approving on behalf of the user; clear stale source evidence through the existing input event.
- [ ] Verify unit/evaluation/build, existing browser journeys, new card-to-source behavior, mobile/desktop RTL and accessibility. No paid inference.
- [ ] Publish focused reviewable commit and integrate after successful current-head checks. Preserve older Muse branches and existing hosted backend.
