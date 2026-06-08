exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { email, name } = JSON.parse(event.body);
    const firstName = name ? name.split(' ')[0] : '';
    const lastName = name && name.split(' ').length > 1 ? name.split(' ').slice(1).join(' ') : '';
    const apiKey = process.env.KLAVIYO_PRIVATE_KEY;
    const headers = {
      'Content-Type': 'application/json',
      'revision': '2024-05-15',
      'Authorization': `Klaviyo-API-Key ${apiKey}`
    };

    // Step 1: Create or update the profile with name
    const profileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email,
            first_name: firstName,
            last_name: lastName
          }
        }
      })
    });

    const profileData = await profileResponse.json();
    console.log('Profile response:', profileResponse.status, JSON.stringify(profileData));

    // Get profile ID — works whether new or already exists
    let profileId;
    if (profileResponse.status === 201) {
      profileId = profileData.data.id;
    } else if (profileResponse.status === 409) {
      profileId = profileData.errors[0].meta.duplicate_profile_id;
    } else {
      return { statusCode: profileResponse.status, body: JSON.stringify(profileData) };
    }

    // Step 2: Subscribe the profile to the list
    const subscribeResponse = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: [{
                type: 'profile',
                id: profileId,
                attributes: {
                  email,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED'
                      }
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

    const subscribeData = await subscribeResponse.text();
    console.log('Subscribe response:', subscribeResponse.status, subscribeData);
    return {
      statusCode: subscribeResponse.status,
      body: subscribeData
    };

  } catch (err) {
    console.error('Function error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
