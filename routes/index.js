var express = require('express');
var router = express.Router();
var path = require('path');

//var authorized = false;

/* GET home page. */
router.get('/', function(req, res) {
  /*if (req.protocol == 'https') {
    res.render('index', {
      title: 'Express',
      title2: 'mobile arcgis application'
    });
  }
  else
    res.redirect('https://geo-1/');*/
  res.redirect('/map');
});

router.post('/map', function(req, res) {
  //authorized = true;
  //res.redirect('http://geo-1/map');
});

router.get('/map', function(req, res) {
  //if (authorized) {
    if (req.protocol == 'http') {
      var p = path.resolve(__dirname + '/../public/viewer.html');
      res.sendFile(p);
    }
    else
      res.redirect('/map');
  /*}
  else
    res.redirect('https://geo-1/');*/
});

module.exports = router;
