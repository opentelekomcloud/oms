// Thanks to @ctaylo21 at https://github.com/jefflau/jest-fetch-mock/issues/122#issuecomment-542273089

import { GlobalWithFetchMock } from 'jest-fetch-mock';

const customGlobal = global as unknown as GlobalWithFetchMock;
customGlobal.fetch = require('jest-fetch-mock');
customGlobal.fetchMock = customGlobal.fetch;

jest.setMock('cross-fetch', fetch);
fetchMock.dontMock()
