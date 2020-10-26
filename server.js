if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

var accessToken = "";
var refreshToken = "";
var oauth2;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const url=process.env.URL;
const redirectUrl=process.env.REDIRECT_URL;
//Install express server
const express = require('express');
var jsforce = require('jsforce');
const app = express();
const server = require('http').createServer(app);
var bodyParser = require('body-parser');
const { stringify } = require('querystring');

var conn = new jsforce.Connection();


app.use(bodyParser.urlencoded({
  extended: true
}));


app.post('/api/initialize', function(req,res) {

    oauth2 = new jsforce.OAuth2({
      // you can change loginUrl to connect to sandbox or prerelease env.
      loginUrl : 'https://login.salesforce.com',
      clientId : clientId,
      clientSecret : clientSecret,
      redirectUri : redirectUrl
    });
    //

    console.log(redirectUrl);
    // Get authorization url and redirect to it.
    //
    res.redirect(oauth2.getAuthorizationUrl({ scope : 'api refresh_token' }));
});

app.get('/api/callback', function(req, res) {
  
  conn = new jsforce.Connection({ oauth2 : oauth2 });
  var code = req.param('code');
  conn.authorize(code, function(err, userInfo) {
    if (err) { return console.error(err); }
    // Now you can get the access token, refresh token, and instance URL information.
    // Save them to establish connection next time.
    console.log(conn.accessToken);
    console.log(conn.refreshToken);
    console.log(conn.instanceUrl);
    console.log("User ID: " + userInfo.id);
    console.log("Org ID: " + userInfo.organizationId);

    // ...
    res.send('success'); // or your desired response
  });
});


app.post('/api/createLead', function(req,res) {
    let id = req.query.id;
    console.log(req.body);
    
    if(id=='fuckyou'){
      var body = { method:'getProducts',params: {'productId':''}};

      createLead(body,res);
    }else{
      res.send('sorry whore');
    }

});


function createLead(body,res){

  conn.apex.post("/Methods/testObject", body, function(err, result) {

    if (err) {
        console.log("INVALID_SESSION_ID");
        console.log(refreshToken);
        console.log(accessToken);
        if(err.errorCode=="INVALID_SESSION_ID"){

            // Alternatively, you can use the callback style request to fetch the refresh token
            conn.oauth2.refreshToken(conn.refreshToken, (err, results) => {
              if (err) return reject(err);
              resolve(results);
            }).then(()=>{
              conn.apex.post("/Methods/testObject", body, function(err, result){
                    if(err){
                        return err;
                    }else{
                        if(res!=null){
                          console.log('getit');

                          res.json({leads:result});
                        }else{
                          console.log('Nope');
                          return new Promise((resolve)=>{
                            resolve(JSON.stringify(result));
                          });
                        }
                    }
                })
            }).catch({

            });
        }
    }else{
        if(res!=null){
          console.log('getit');

          res.json({leads:result});
        }else{
          console.log('Yup');
          return new Promise((resolve)=>{
            resolve(JSON.stringify(result));
          });
        }

    }
  // the response object structure depends on the definition of apex class
  });

}


server.listen(process.env.PORT);
// Start the app by listening on the default Heroku port
//app.listen(process.env.PORT || 3000);
