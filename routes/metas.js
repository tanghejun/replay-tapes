var express = require('express');
var router = express.Router();
var db = require('../db')

/* GET home page. */


router.get('/:id', function(req, res, next) {
    console.log(req.params.id);
    var collection = db.get().collection('meta');
    collection.findOne({ i: req.params.id }, {"_id": 0}, function(err, result) {
        if (result) {
            res.send(result)
        } else {
	        res.sendStatus(404)
        }
    })
});

router.get('/', function(req, res, next) {
    var collection = db.get().collection('meta');
    collection.find({}, {"_id": 0}).toArray(function(err, result) {
        res.json(result);
    })

})

router.post('/', function(req, res, next) {
    console.log(req.body);

    if (req.body.i) {
        var collection = db.get().collection('meta');
        collection.insertOne(req.body, function(err, result) {
            if (err) {
            	res.send(err)
            } else {
	            console.log('insert meta ok');
            }
        })
    } else {
        res.sendStatus(500)
    }

});

module.exports = router;
