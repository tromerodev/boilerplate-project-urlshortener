'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');
const dns = require('dns');
const url = require('url');

const isUrl = require('is-url');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI,{ useNewUrlParser: true }).then(
console.log("connected to db")).catch(err=>{
console.log(err)});

//mongodb schema and model

var Schema = mongoose.Schema;

var urlSchema = new Schema ({
original_url: String,
short_url: String
})

var Url = mongoose.model('Url',urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}))

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


//get the original url and store it to db
app.post("/api/shorturl/new",function(req,res,next) {
  let urlForm = req.body.url;
  
  if(isUrl(urlForm)){
    let url = new URL(urlForm);
    let hostname = url.hostname;
    console.log("hostname "+hostname);
    
    dns.lookup(hostname, (err, address) =>{
      console.log("err "+err);
      console.log("dns "+address);

        if(err == null){
          Url.find().then(urls=>{

            let newUrl = new Url({
              original_url: url,
              short_url: urls.length +1
            })

            newUrl.save().then(data=>{
              res.json({"original_url":newUrl["original_url"],
                       "short_url":newUrl["short_url"]})
              return data;
            }).catch(err=>{
              return err})
          })
        } else {
        res.json({"error":"invalid URL - no hostname exists"});
        }
    })
  } else {
  res.json({"error":"invalid URL - format http(s)://www.-"});
  }
  
});

// get the with the short url the web original url
app.get("/api/shorturl/:short_url", function (req, res) {
  let shortUrl = req.params.short_url;
  Url.findOne({short_url:shortUrl}).then(url =>{
    res.redirect(url.original_url)
  }).catch(err=>{
    res.json({"something wrong":"happend"})
  })
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});