# Anxina

Anxina is a static news site that hydrates its pages with content pulled directly from the WordPress REST API. The UI lives in the repository root and reads the endpoint configuration from `wp-config.js`.

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

If you leave `apiUrl` empty, the scripts fall back to the public [WordPress News API](https://wordpress.org/news/wp-json/wp/v2/posts?_embed=1) so you can demo the site without configuring Netlify Functions or a custom backend.

## Running locally
1. Update `wp-config.js` with your WordPress REST API URL (as shown above).
2. Serve the site with any static file server. For example, install [serve](https://www.npmjs.com/package/serve) and run `npx serve .`, or use the static server that ships with your editor.
3. Open the reported URL (typically `http://localhost:3000`) and the pages (`index.html`, `post.html`, `search.html`) will use your configuration when fetching posts.

## Deploying

Because the project is a bundle of static assets, you can host it on any static site provider (Netlify, GitHub Pages, Cloudflare Pages, an S3 bucket, etc.). When deploying, make sure `wp-config.js` contains the production API URL you want to use.
