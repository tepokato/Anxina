exports.handler = async function(event, context) {
  try {
    const response = await fetch('https://www.blogger.com/feeds/4840049977445065362/posts/default?alt=rss');
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=300'
        },
        body: `Error fetching feed: ${response.statusText}`
      };
    }
    const body = await response.text();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/rss+xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=300'
      },
      body
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=300'
      },
      body: 'Internal server error'
    };
  }
};
