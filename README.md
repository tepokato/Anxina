# Anxina

Anxina is a static news site that hydrates its pages with content pulled from a WordPress API (and optionally Blogger) through Netlify serverless functions. The front-end lives in the repository root while the functions are located in `netlify/functions`.

## Environment variables

### Required
- `WP_BASE_URL`: Base URL of the WordPress site that exposes the REST API (for example `https://example.com`). The Netlify function trims trailing slashes and requests `wp-json/wp/v2/posts` from that domain.

### Optional authentication for private WordPress sites
If your WordPress instance is protected by HTTP Basic Auth or uses Application Passwords, expose the credentials through these environment variables so the Netlify function can add the `Authorization` header automatically.

- `WP_AUTH_USERNAME`: Username for the private WordPress site.
- `WP_AUTH_PASSWORD`: Password (or WordPress Application Password) for the private site.

Both variables must be set together. If only one is provided, the function will return an error to avoid making unauthenticated requests.

### Additional integrations
The repository also contains `netlify/functions/blogger.js`, which consumes the Blogger v3 API. To enable it, define:
- `BLOGGER_API_KEY`
- `BLOGGER_BLOG_ID`

These variables are optional unless you wire the Blogger endpoint into the UI.

## Running locally
1. Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) and authenticate: `npm install -g netlify-cli` then `netlify login`.
2. Set the required environment variables for your local Netlify environment. You can use `netlify env:set WP_BASE_URL https://example.com` (and the optional auth variables) so `netlify dev` can inject them when serving functions.
3. Start the development server: `netlify dev`. This serves the static front-end from the project root and proxies calls to the serverless functions.

## Deploying to Netlify
Netlify automatically bundles any functions stored in `netlify/functions/*.js`. To deploy this repository:

1. Push the code to a Git provider (GitHub, GitLab, or Bitbucket).
2. In Netlify, click **Add new site → Import an existing project** and connect the repository.
3. In the **Build options, and deploy!** step:
   - **Base directory:** leave blank (project root).
   - **Build command:** leave blank (no build step is required for this static site).
   - **Publish directory:** `.` (the repository root that contains `index.html`).
4. Click **Deploy site**.

### Setting environment variables in the Netlify UI
1. Open your site in Netlify and navigate to **Site configuration → Environment variables**.
2. Click **Add a variable**, then enter the name (`WP_BASE_URL`) and value of your WordPress site. Repeat for `WP_AUTH_USERNAME`/`WP_AUTH_PASSWORD` (if needed) and any Blogger credentials.
3. Save the variables. Netlify will ask you to trigger a new deploy; click **Deploy site** (or **Trigger deploy → Deploy site**) so the new values are available to your functions.

Once deployed, the `/index.html`, `/post.html`, and other static pages will call `/.netlify/functions/wordpress`, which now includes the credentials (when provided) and fetches the latest posts from your WordPress instance.
