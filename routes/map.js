/**
 * Created by borovennikov on 28.11.2014.
 */
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    console.log('qq');
    //res.sendFile(__dirname + '/viewer/index.html');
    /*res.render('map', {
        map: 'Express',
        title2: 'mobile arcgis application'
    });*/
});

module.exports = router;
