import {AuthOptions} from "../../src/oms/core/types"
import Client from '../../src/oms/client'
import intern from 'intern'

const {suite, test} = intern.getPlugin('interface.tdd')
const {assert} = intern.getPlugin('chai')


suite('Client', () => {
    test('Instance', () => {
        const obj = new Client(new AuthOptions());
        assert.hasAllKeys<Client>(obj, ['httpClient', 'authURL', 'authOptions'])
    })
})
