# Portfolio thumbnails

One image per project, named after its id in `../portfolio.json`: `thumbs/<id>.jpg` (PNG and WebP also work when `thumb` in the portfolio file says so).

Generate them from the project links with:

```
npm install
npm run screenshots
```

That opens each project's first link in a headless browser and saves a 1000px-wide capture here. A project with no image simply shows no thumbnail.
