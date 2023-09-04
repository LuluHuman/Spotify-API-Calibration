const express = require('express'); 
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require("axios")
const {client_id, client_secret} = require("./config.json")
const redirect_uri = 'http://localhost:3000/redirect'; // Your redirect uri

var stateKey = 'spotify_auth_state';
var state = null

var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var app = express();
app.use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());

app.get('/login', function (req, res) {
  state = generateRandomString(16);
  var scope = 'user-read-private user-read-email playlist-read-private user-library-read playlist-modify-public playlist-modify-private';

  res.cookie(stateKey, state);
  res.redirect(
    'https://accounts.spotify.com/authorize?' +
    'response_type=code&' +
    `client_id=${client_id}&` +
    `scope=${scope}&` +
    `redirect_uri=${redirect_uri}&` +
    `state=${state}`
  );
});

app.get('/redirect', async function (req, res) {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state == null || state !== storedState) return res.redirect('/#?error=state_mismatch');
  res.clearCookie(stateKey);

  let response = await axios.request(
    {
      url: "https://accounts.spotify.com/api/token",
      method: "POST",
      headers: {
        "Authorization": "Basic " + (new Buffer.from(client_id + ':' + client_secret).toString('base64')),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data:
        `code=${code}` +
        `&redirect_uri=${redirect_uri}` +
        `&grant_type=authorization_code`,
    }
  )

  const body = response.data
  if (response.status !== 200) return res.redirect('/#?error=invalid_token');

  res.redirect(`/#?access_token=${body.access_token}&refresh_token=${body.refresh_token}`);
})

app.get('/refresh_token',async function (req, res) {
  const refresh_token = req.query.refresh_token;

  let response = await axios.request(
    {
      url: "https://accounts.spotify.com/api/token",
      method: "POST",
      headers: {
        "Authorization": "Basic " + (new Buffer.from(client_id + ':' + client_secret).toString('base64')),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data:
        `grant_type=refresh_token` +
        `&refresh_token=${refresh_token}`
    }
  )

  if (response.status !== 200) return res.redirect('/#?error=invalid_token');

  const body = response.data
  const access_token = body.access_token;
  res.send({'access_token': access_token});
});

console.log('Listening on 3000');
app.listen(3000);
