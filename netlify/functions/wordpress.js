exports.handler = async function(event, context) {
  try {
    const baseUrl = process.env.WP_BASE_URL;
    if (!baseUrl) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=60'
        },
        body: 'Missing WordPress base URL'
      };
    }

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const url = `${normalizedBaseUrl}/wp-json/wp/v2/posts`;
    const response = await fetch(url);

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=60'
        },
        body: `Error fetching posts: ${response.statusText}`
      };
    }

    const body = await response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=60'
      },
      body
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=60'
      },
      body: 'Internal server error'
    };
  }
};
