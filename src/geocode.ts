import * as core from '@actions/core';
import ky, { HTTPError } from 'ky';

const SPACES = / +/;
const INVALID_CHARS = /[^a-zA-Z0-9]/g;

interface GeocodeResult {
  location: {
    x: number;
    y: number;
  };
  score: number;
  locator?: string;
  matchAddress: string;
  inputAddress: string;
  standardizedAddress?: string;
  addressGrid: string;
  scoreDifference?: number;
  candidates?: GeocodeResult[];
}

interface GeocodeResponse {
  status: number;
  result?: GeocodeResult;
}

interface ApiError {
  error?: string;
  message?: string;
}

const cleanseStreet = (data: string | undefined) => {
  const replacement = ' ';

  // & -> and
  let street = (data || '').replace('&', 'and');
  street = street.replace(INVALID_CHARS, replacement);
  street = street.replace(SPACES, replacement);

  return street.trim();
};

const cleanseZone = (data: string | undefined) => {
  let zone = (data || '').toString().replace(INVALID_CHARS, ' ');
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

    if (!street.length || !zone.length) {
      results.push({ status: false, record, response: 'Invalid address' });
      continue;
    }

    try {
      const response = await ky<GeocodeResponse>(`geocode/${street}/${zone}`, {
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

      if (response.status === 200 && response.result) {
        const { score } = response.result;
        results.push({ status: true, response: score, record });
      } else {
        results.push({
          status: false,
          response: 'Invalid response from API',
          record,
        });
      }
    } catch (error) {
      core.error(`Error geocoding street [${street}] zone [${zone}]: ${error}`);

      let errorMessage = 'unknown error';

      if (error instanceof HTTPError) {
        try {
          const errorResponse = (await error.response.json()) as ApiError;
          errorMessage =
            errorResponse.error || errorResponse.message || errorMessage;
        } catch {
          errorMessage = error.message || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      core.debug(`Error response: ${errorMessage}`);

      results.push({
        status: false,
        response: errorMessage,
        record,
      });
    }

    await coolYourJets();
  }

  return results;
};
