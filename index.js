module.exports = (app, pathToWatch) => {
  const fs = require('fs')
  const url = require('url')
  const path = require('path')
  const send = require('send')
  // const express = require('express')
  // const app = express()
  const es = require('event-stream')
  const ws = require('express-ws')
  const chokidar = require('chokidar')
  const serveIndex = require('serve-index')

  const expressWs = ws(app)
  const wss = expressWs.getWss()

  app.ws('/echo', ws => {
    console.log('ws', 'Client connected')
  })

  chokidar
    .watch(pathToWatch, {usePolling: true})
    .on('all', (event, changePath) => {
      if (event !== 'change') {
        return
      }

      wss
        .clients
        .forEach(client => client.send(path.extname(changePath) === '.css' ? 'stylesReload' : 'fullReload'))
    })

  const INJECTED_CODE = require('./injection_payload.js').payload()

  function injectCode () {
    return function (req, res, next) {
      if (path.extname(req.url) === '' && req.url !== '/') {
        next()
      }

      const injectCandidates = [new RegExp('</body>', 'i'), new RegExp('</svg>'), new RegExp('</head>', 'i')]
      const reqpath = url.parse(req.url).pathname === '/' ? '/index.html' : url.parse(req.url).pathname
      let injectTag = null

      function error (err) {
        res.statusCode = err.status || 500
        res.end(err.message)
      }

      function directory () {
        res.statusCode = 301
        res.setHeader('Location', req.url + '/')
        res.end('Redirecting to ' + req.url + '/')
      }

      function inject (stream) {
        if (injectTag) {
          const len = INJECTED_CODE.length + res.getHeader('Content-Length')
          res.setHeader('Content-Length', len)
          const originalPipe = stream.pipe
          stream.pipe = (resp) => {
            originalPipe.call(stream, es.replace(new RegExp(injectTag, 'i'), INJECTED_CODE + injectTag)).pipe(resp)
          }
        }
      }

      function file (filepath /*, stat*/) {
        const x = path.extname(filepath).toLocaleLowerCase()
        const possibleExtensions = ['', '.html', '.htm', '.xhtml', '.php', '.svg']
        let match
        if (possibleExtensions.indexOf(x) > -1) {
          const fileContent = fs.readFileSync(filepath, 'utf8')
          for (let i = 0; i < injectCandidates.length; ++i) {
            match = injectCandidates[i].exec(fileContent)
            if (match) {
              injectTag = match[0]
              break
            }
          }
        }
      }

      send(req, reqpath, {root: pathToWatch})
        .on('error', error)
        .on('directory', directory)
        .on('file', file)
        .on('stream', inject)
        .pipe(res)
    }

  }

  return app.use(injectCode())
}