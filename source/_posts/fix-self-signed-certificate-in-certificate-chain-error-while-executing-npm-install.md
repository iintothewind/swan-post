---
title: fix self signed certificate in certificate chain error while executing npm install
date: 2019-12-12 13:20:30
tags: [javascript,npm]
---

## the problem
The error occurred while executing "npm clean-install":

```
gyp ERR! configure error
gyp ERR! stack Error: self signed certificate in certificate chain
gyp ERR! stack     at TLSSocket.onConnectSecure (_tls_wrap.js:1349:34)
gyp ERR! stack     at TLSSocket.emit (events.js:219:5)
gyp ERR! stack     at TLSSocket._finishInit (_tls_wrap.js:822:8)
gyp ERR! stack     at TLSWrap.ssl.onhandshakedone (_tls_wrap.js:618:12)
```

## the solution

```bash
npm config set strict-ssl false
export NODE_TLS_REJECT_UNAUTHORIZED=0
```
