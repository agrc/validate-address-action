import * as core from '@actions/core';
import ky from 'ky';

const SPACES = / +/;
const INVALID_CHARS = /[^a-zA-Z0-9]/g;

const cleanseStreet = (data: string) => {
  const replacement = ' ';

  // & -> and
  let street = data.replace('&', 'and');
  street = street.replace(INVALID_CHARS, replacement);
  street = street.replace(SPACES, replacement);

  return street.trim();
};

const cleanseZone = (data: string) => {
  let zone = data.toString().replace(INVALID_CHARS, ' ');
  zone = zone.replace(SPACES, ' ').trim();

  if (zone.length > 0 && zone[0] == '8') {
    zone = zone.slice(0, 5);
  }

  return zone;
};

const coolYourJets = () => {
  const min = 150;
  const max = 300;

  return new Promise((resolve) =>
    setTimeout(resolve, Math.random() * (max - min) + min),
  );
};

export const geocode = async (addresses: string[], apiKey: string) => {
  const results: {
    status: boolean;
    record: string;
    response: string | number;
  }[] = [];
  for await (const record of addresses) {
    let [street, zone] = record.split(',');
    street = cleanseStreet(street);
    zone = cleanseZone(zone);

    let response;

    if (!street.length || !zone.length) {
      results.push({ status: false, record, response: 'Invalid address' });

      continue;
    } else {
      try {
        response = await ky(`geocode/${street}/${zone}`, {
          headers: {
            'x-agrc-geocode-client': 'github-action',
            'x-agrc-geocode-client-version': '1.0.0',
            Referer: 'https://api-client.ugrc.utah.gov/',
          },
          searchParams: {
            apiKey: apiKey,
            locators: 'roadCenterlines',
          },
          prefixUrl: 'https://api.mapserv.utah.gov/api/v1/',
        }).json();
      } catch (error) {
        core.error(
          `Error geocoding street [${street}] zone [${zone}]: ${error}`,
        );

        try {
          response = JSON.parse(error.response.body);
        } catch {
          response = { error: error.message };
        }

        core.debug(`Error response: ${JSON.stringify(response)}`);

        results.push({
          status: false,
          response: response?.error ?? 'unknown error',
          record,
        });
      }
    }

    if (response.status === 200) {
      const result = response.result;
      const { score } = result;

      results.push({ status: true, response: score, record });
    }

    await coolYourJets();
  }

  return results;
};
