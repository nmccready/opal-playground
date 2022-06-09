const express = require('express');
const bodyParser = require('body-parser');
const opaMiddlewareFact = require('@build-security/opa-express-middleware');

const app = express();
const jsonParserMiddle = bodyParser.json();

const sessionMiddle = require('express-session');
const Store = require('memorystore')(sessionMiddle);

const opaConfig = {
  port: 8181,
  hostname: 'http://localhost',
  enable: true,
};

// simplified user session without checking login password
// just checking policy data for user existence
const loginMiddle = opaMiddlewareFact.authorize((req) => {
  return {
    ...opaConfig,
    policyPath: '/app/rbac/user_exist',
    enrich: { user: req.params.user },
  };
});

const allowMiddle = opaMiddlewareFact.authorize((req) => {
  req.permission = req.permission || {};
  return {
    ...opaConfig,
    policyPath: '/app/rbac/allow',
    enrich: { user: req.session.user, ...req.permission },
  };
});

// custom opa middleware which handles our different permission setup
// IE different than opaMiddleware.permissions schema
const permission = ({ action, type }) => {
  return (req, res, next) => {
    req.permission = { action, type };
    next();
  };
};

const DAY_MILLISECS = 10000 * 60 * 60 * 24;
// use to save cookie info like username etc..
app.use(
  sessionMiddle({
    cookie: { maxAge: DAY_MILLISECS },
    store: new Store({
      checkPeriod: DAY_MILLISECS, // when to prune expired entries
    }),
    resave: false,
    secret: 'funky cold medina',
  })
);

// Add the extAuthzMiddleware here to apply to all requests.
// This has one drawback: route parameters will not be available
// to the authz policy as input.
app.use(jsonParserMiddle);

app.get('/login/:user', loginMiddle, (req, res) => {
  req.session.user = req.params.user;
  res.send('allowed');
});

// Applying the middleware per route makes the route parameters "region" and "userId"
// available to the authz policy as input.
app.get('/cats', permission({ action: 'read', type: 'cat' }), allowMiddle, (req, res) => {
  res.send('allowed');
});

app.put('/cats', permission({ action: 'update', type: 'cat' }), allowMiddle, (req, res) => {
  res.send('allowed');
});

app.get(
  '/adopt/cats/:cat',
  permission({ action: 'adopt', type: 'cat' }),
  allowMiddle,
  (req, res) => {
    res.send('allowed');
  }
);

app.get('/dogs', permission({ action: 'read', type: 'dog' }), allowMiddle, (req, res) => {
  res.send('allowed');
});

app.put('/dogs', permission({ action: 'update', type: 'cat' }), allowMiddle, (req, res) => {
  res.send('allowed');
});

app.get(
  '/adopt/dogs/:dog',
  permission({ action: 'adopt', type: 'dog' }),
  allowMiddle,
  (req, res) => {
    res.send('allowed');
  }
);

app.get(
  '/financials',
  permission({ action: 'read', type: 'finance' }),
  allowMiddle,
  (req, res) => {
    res.send('allowed');
  }
);

app.put(
  '/financials',
  permission({ action: 'update', type: 'finance' }),
  allowMiddle,
  (req, res) => {
    res.send('allowed');
  }
);

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
