# Backend
- [ ] Determine models/controllers/services for music blog posts:
    - [ ] Create an Apple Music Replay type list.
    - [ ] Albums listened on previous years.
- [ ] Add real way of storing people's recommended tracks. 
- [ ] Rate limit (?) track recommending to prevent spam.
- [ ] Add a way to detect already recommended tracks.
- [ ] Update terminal functionality to navigate pages.
- [ ] Travel routes between pins:
    - [ ] New `Route` model: `id`, `from_pin_id`, `to_pin_id`, `mode` (plane/boat/car), optional `label`.
    - [ ] New DB table with foreign keys to pins — cascade delete when a referenced pin is deleted.
    - [ ] CRUD handlers + service layer (GET all routes, POST create, DELETE by id).


# Frontend
- [ ] Increase size of image viewing modal to take up more of the screen.
- [ ] Add projects from github to projects page.
- [ ] Fix terminal ascii art it looks so chopped.
- [ ] Remove cursor from terminal when user has not clicked on terminal. Only become active when user clicks on terminal tile.
- [ ] Travel routes between pins:
    - [ ] Fetch routes from API and render as Leaflet `Polyline` on the travels map.
    - [ ] Distinct visual style per mode — e.g. solid line for driving, dashed for boat, dotted + lighter for plane.
    - [ ] Toggle button in map header to show/hide routes (hidden by default to avoid clutter).
    - [ ] Admin panel: new panel mode to create a route — pick from/to from existing pins via dropdowns, select mode, save. Also support deleting routes from the selected-pin panel.

# Misc
 - [ ] Start thinking about adding blog post stuff.
 - [ ] Check out Neon for DB instead of SQLite.
 - [ ] Get good at railway deployments or find a better alternative.
 - [ ] Change bullet icon in chess tile in home page to look more like a bullet.
 - [ ] Figure out why Lichess API only shows that I have played games since May 14 when I have played since before.
 - [ ] Make album for Franchonia Notch.

# Fullstack
- [ ] GitHub projects page.
