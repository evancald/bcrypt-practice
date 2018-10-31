const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const massive = require('massive');
const session = require('express-session');
const bcrypt = require('bcrypt-nodejs');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'asdfads',
  resave: true,
  saveUninitialized: true
}));
massive("postgres://wfetapotgshgov:63f2c1e96578fc7d74eaa60b75718c9158ac387f935558ffce04a59e7b002447@ec2-50-16-196-57.compute-1.amazonaws.com:5432/d7ek57gl0c0obt?ssl=true")
  .then(db => {
    app.set('db', db);
    console.log('database is connected');
  })
  .catch(err => {
    console.log('database connection error', err);
  })

//endpoints
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  bcrypt.hash(password, null, null, (err, hash) => {
    if (err) {
      return res.send('something went wrong during hasing');
    }
    req.app.get('db').create_user([username, hash])
      .then(() => {
        res.status(200).send('user created successfully');
      })
    })
})

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  req.app.get('db').login_user([username]).then(user => {
    bcrypt.compare(password, user[0].password, (err, isCorrectPassword) => {
      if (err) {
        return res.send(err);
      }
      if (isCorrectPassword) {
        req.session.user = user[0];
        res.send('login successful');
      } else {
        res.send('incorrect username or password');
      }
    })
  })
  .catch(err => {
    res.status(500).send(err);
  })
})

app.get('/check', (req, res) => {
  if (req.session.user) {
    res.status(200).send(`currently logged in as ${req.session.user.username}`);
  } else {
    res.status(200).send('not currently logged in.');
  }
})

app.post('/logout', (req, res) => {
  delete req.session.user;
  res.status(200).send('logout successful');
})


const port = 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
})