// Netlify serverless function — proxies the Klaviyo subscription
// so the request comes from the server, not the browser.
// This bypasses ad blockers that block a.klaviyo.com client-side.

exports.handler = async function(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, name } = JSON.parse(event.body);

    const response = await fetch('https://a.klaviyo.com/api/v2/list/SL99du/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: 'RgLYei',
        profiles: [{ email: email, first_name: name }]
      })
    });

    const data = await response.text();
    console.log('Klaviyo response:', response.status, data);

    return {
      statusCode: response.status,
      body: data
    };

  } catch (err) {
    console.error('Function error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
