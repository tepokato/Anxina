# El común

El común is a static news site that hydrates its pages with content pulled directly from the WordPress REST API. The UI lives in the repository root and reads the endpoint configuration from `wp-config.js`.

## Configuration

Copy `wp-config.js` (or edit it in place) and update it with your WordPress endpoint:

```js
window.WP_CONFIG = {
  apiUrl: 'https://your-wordpress-site.com/wp-json/wp/v2/posts?_embed=1',
  username: 'optional_user',
  password: 'optional_password'
};
```

The credentials are optional. If you do not need Basic Auth or WordPress Application Passwords, leave both fields empty. The file is listed in `.gitignore` so you can safely store local credentials without committing them.

### Choosing an API endpoint

* Point `apiUrl` at the REST collection you want to expose. The default example fetches posts with `_embed=1` so featured images and author data are available.
* If your WordPress site is private or protected, enable Basic Auth or generate an Application Password and supply the values in `username` and `password`.
* When `apiUrl` is empty, the scripts fall back to the public [WordPress News API](https://wordpress.org/news/wp-json/wp/v2/posts?_embed=1) so you can explore the UI without connecting to your own site.

### Cross-origin considerations

If the WordPress API is served from a different origin than the static assets, make sure CORS is enabled for the routes you request. Serving the site from the same domain (for example, through a subdirectory on the WordPress host) avoids this requirement.

## Running locally
1. Update `wp-config.js` with your WordPress REST API URL (as shown above).
2. Serve the site with any static file server. For example, install [serve](https://www.npmjs.com/package/serve) and run `npx serve .`, or use the static server that ships with your editor.
3. Open the reported URL (typically `http://localhost:3000`) and the pages (`index.html`, `post.html`, `search.html`) will use your configuration when fetching posts.

## Hosting & deployment

El común is a bundle of static assets that talk to WordPress directly from the browser. You can deploy the contents of the repository to any static host:

* **WordPress-hosted** – Upload the compiled assets (including `index.html`, `post.html`, `search.html`, and the `assets/` directory) to a subdirectory on the same domain as your WordPress site. This keeps the API on the same origin and simplifies authentication.
* **Static hosting services** – Platforms such as GitHub Pages, Cloudflare Pages, Vercel, an S3 bucket behind CloudFront, or traditional web servers can serve the files as-is. Configure `wp-config.js` with the production `apiUrl` before deploying so the static site knows where to fetch data.

Regardless of the host, no server-side rendering or build step is required. The only moving part is the WordPress REST API you point the configuration at, so deployments are as simple as uploading the static files.
