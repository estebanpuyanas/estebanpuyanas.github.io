# Backend
- [ ] Add real way of storing people's recommended tracks. 
- [ ] Rate limit (?) track recommending to prevent spam.
- [ ] Add a way to detect already recommended tracks.
- [ ] Travel routes between pins:
    - [ ] New `Route` model: `id`, `from_pin_id`, `to_pin_id`, `mode` (plane/boat/car), optional `label`.
    - [ ] New DB table with foreign keys to pins — cascade delete when a referenced pin is deleted.
    - [ ] CRUD handlers + service layer (GET all routes, POST create, DELETE by id).

# Frontend
- [ ] Travel routes between pins:
    - [ ] Fetch routes from API and render as Leaflet `Polyline` on the travels map.
    - [ ] Distinct visual style per mode — e.g. solid line for driving, dashed for boat, dotted + lighter for plane.
    - [ ] Toggle button in map header to show/hide routes (hidden by default to avoid clutter).
    - [ ] Admin panel: new panel mode to create a route — pick from/to from existing pins via dropdowns, select mode, save. Also support deleting routes from the selected-pin panel.
- [ ] Increase size of modal when editing images.
- [ ] Change image cropping so you can select from specific corner to crop rather than just from center.

# Misc
 - [ ] Change bullet icon in chess tile in home page to look more like a bullet.

# Fullstack

# Security
- [ ] Validate `ADMIN_TOKEN` at startup in `main.go` with `log.Fatal` if unset (same pattern as `DATABASE_URL` and `LASTFM_API_KEY`). Pass it into `AdminMiddleware` as a parameter instead of calling `os.Getenv` on every request.
- [ ] Restrict `Access-Control-Allow-Origin` to the frontend's deployed origin once stable, rather than `*`. Especially unnecessary for admin endpoints.
- [ ] Add `http.MaxBytesReader` to the blog post JSON handlers (`CreatePost`, `UpdatePost`) to cap request body size (e.g. 1 MB).
