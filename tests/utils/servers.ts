import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { randomString } from './helpers';
import { AddressInfo } from 'net';

export const fakeToken = randomString(20)

function checkAuth(req: IncomingMessage, resp: ServerResponse): boolean {
    if (!req.headers) {
        resp.writeHead(400, 'Invalid headers')
        return false
    }
    const tok = req.headers['X-Auth-Token']
    if (!tok) {
        resp.statusCode = 401
        return false
    }
    if (tok != fakeToken) {
        resp.statusCode = 403
        return false
    }
    return true
}

export const fakeAuthServer: Server = createServer((req, resp) => {
    resp.setHeader('Content-Type', 'application/json')
    switch (req.url) {
    case '/':
        resp.statusCode = 200
        resp.write('{}')
        break
    case '/v3/auth/tokens':
        resp.setHeader('X-Subject-Token', fakeToken)
        resp.statusCode = 200
        resp.write(JSON.stringify('{}'))
        break
    case '/v3/endpoints':
        if (!checkAuth) {
            break
        }
        resp.statusCode = 200
        resp.write(JSON.stringify(fakeEndpoints()))
        break
    case '/v3/services':
        if (!checkAuth) {
            break
        }
        resp.statusCode = 200
        resp.write(JSON.stringify(fakeServices()))
        break
    default:
        resp.writeHead(404, 'Endpoint unknown')
        break
    }
    resp.end()
})
const authPort = () => (fakeAuthServer.address() as AddressInfo).port
export const authServerUrl = (): string => `http://localhost:${authPort()}`
export const fakeServiceServer: Server = createServer((req, resp) => {
    resp.setHeader('Content-Type', 'application/json')
    if (!checkAuth) {
        return
    }
    resp.statusCode = 200
    switch (req.url) {
    case '/':
        resp.write(JSON.stringify(fakeVersions()))
    }
})
const servicePort = () => (fakeServiceServer.address() as AddressInfo).port
export const serviceServerUrl = (): string => `http://localhost:${servicePort()}`
export const fakeService = { type: 'image', version: '2', id: '90095f474f054b4ba6e029bc398ccb59' }
const fakeVersions = () => ({
    'versions': [
        {
            'status': 'CURRENT',
            'id': `v${fakeService.version}.6`,
            'links': [
                {
                    'href': `${serviceServerUrl()}/v${fakeService.version}.6/`,
                    'rel': 'self'
                }
            ]
        },
        {
            'status': 'SUPPORTED',
            'id': `v${fakeService.version}.5`,
            'links': [
                {
                    'href': `${serviceServerUrl()}/v${fakeService.version}.5/`,
                    'rel': 'self'
                }
            ]
        },
        {
            'status': 'DEPRECATED',
            'id': 'v1.1',
            'links': [
                {
                    'href': `${serviceServerUrl()}/v1/`,
                    'rel': 'self'
                }
            ]
        },
    ]
}
)
export const fakeRegion = 'eu-de'
const fakeEndpoints = () => ({
    'endpoints': [
        {
            'service_id': fakeService.id,
            'region_id': fakeRegion,
            'links': {
                'next': null,
                'previous': null,
                'self': `${authServerUrl()}/v3/endpoints/1360c0dc80654c5790c1b6d210f34746`
            },
            'id': '1360c0dc80654c5790c1b6d210f34746',
            'interface': 'public',
            'region': fakeRegion,
            'url': authServerUrl(),
            'enabled': true
        }
    ],
    'links': {
        'next': null,
        'previous': null,
        'self': `${authServerUrl()}/v3/endpoints`
    }
})
const fakeServices = () => ({
    'links': {
        'next': null,
        'previous': null,
        'self': `${authServerUrl()}/v3/services`
    },
    'services': [
        {
            'name': 'cinderv3',
            'links': {
                'next': null,
                'previous': null,
                'self': `${authServerUrl()}/v3/services/01ddc5a9916c45c2b6f46dc604848cb7`
            },
            'id': '01ddc5a9916c45c2b6f46dc604848cb7',
            'type': 'volumev3',
            'enabled': true
        },
        {
            'name': 'glance',
            'links': {
                'next': null,
                'previous': null,
                'self': `${authServerUrl()}/v3/services/${fakeService.id}`
            },
            'id': fakeService.id,
            'type': fakeService.type,
            'enabled': true
        }
    ]
})
