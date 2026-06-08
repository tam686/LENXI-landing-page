exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { email, name } = JSON.parse(event.body);
    const firstName = name ? name.split(' ')[0] : '';
    const lastName = name && name.split(' ').length > 1 ? name.split(' ').slice(1).join(' ') : '';
    const apiKey = process.env.KLAVIYO_PRIVATE_KEY;
    const response = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'revision': '2023-12-15',
        'Authorization': `Klaviyo-API-Key ${apiKey}`
      },
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: [{
                type: 'profile',
                attributes: {
                  email: email,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED'
                      }
                    }
                  }
                },
                meta: {
                  patch_properties: {
                    append: {
                      first_name: firstName,
                      last_name: lastName
                    }
                  }
                }
              }]
            }
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: 'SL99du'
              }
            }
          }
        }
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
      s
