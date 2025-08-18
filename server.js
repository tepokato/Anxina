const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BLOG_ID = process.env.BLOG_ID;
const API_KEY = process.env.BLOGGER_API_KEY;
const PORT = process.env.PORT || 3000;
const INTERVAL = parseInt(process.env.FETCH_INTERVAL, 10) || 300000;
const CACHE_FILE = path.join(__dirname, 'cache.json');

let cache = [];

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load cache', err.message);
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error('Failed to save cache', err.message);
  }
}

async function fetchPosts() {
  if (!BLOG_ID || !API_KEY) {
    console.warn('BLOG_ID or BLOGGER_API_KEY not set');
    return;
  }
  try {
    const url = `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${API_KEY}`;
    const res = await axios.get(url);
    cache = res.data.items || [];
    saveCache();
    console.log(`Fetched ${cache.length} posts`);
  } catch (err) {
    console.error('Failed to fetch posts', err.message);
  }
}

loadCache();
fetchPosts();
setInterval(fetchPosts, INTERVAL);

const app = express();

app.get('/api/posts', (req, res) => {
  res.json({ items: cache });
});

app.get('/api/posts/:id', (req, res) => {
  const post = cache.find(p => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(post);
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
