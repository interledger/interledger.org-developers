module.exports = (config) => {
  // Copy JSON files after build
  const CopyPlugin = require('copy-webpack-plugin')

  config.plugins.push(
    new CopyPlugin({
      patterns: [
        {
          from: 'src/**/*.json',
          to: '../dist/src/[path][name][ext]',
          context: '.'
        }
      ]
    })
  )

  return config
}
