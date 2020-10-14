const path = require('path');

module.exports = {
    entry: './dist/index.js',
    devtool: 'inline-source-map',
    output: {
        library: 'oms',
        filename: 'client.min.js',
        path: path.resolve(__dirname, 'dist'),
    },
};

