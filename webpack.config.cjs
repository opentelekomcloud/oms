const path = require('path');
const LicensePlugin = require('webpack-license-plugin')

module.exports = {
    entry: './dist/index.js',
    devtool: 'source-map',
    output: {
        library: 'oms',
        filename: 'client.min.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new LicensePlugin({
            excludedPackageTest: (packageName, version) => {
                return packageName === 'json-schema'
            },
        })
    ],
};

