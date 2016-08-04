var express = require('express');
var router = express.Router();
var db = require('../db.js');

/* GET events listing. */
router.get('/:id', function(req, res, next) {
    console.log(req.params.id);
    var collection = db.get().collection('events');
    collection.findOne({ i: req.params.id }, {'_id': 0}, function(err, result) {
        if (result) {
            res.json(result)
        } else {
            res.sendStatus(404)
        }
    })
});

router.get('/', function(req, res, next) {
    var collection = db.get().collection('events');
    collection.find({}, {'_id': 0}).toArray(function(err, result) {
        console.log(result);
        res.json(result);
    })

})


/* POST: create events */
router.post('/', function(req, res, next) {
    console.log('body: ', req.body);

    var id = req.body.i;
    if (id) {
        var collection = db.get().collection('events');
        collection.findOne({ i: id }, function(err, data) {
            if (data) {
                // if already has a record, append with new data;
                console.log('update logic..');
                var appended = {
                    i: id,
                    d: data.d.concat(req.body.d)
                };
                collection.updateOne({ i: id }, { $set: appended }, function(err, result) {
                    if (err) {
                        res.send(err);
                    }else {
                        res.sendStatus(200)
                    }
                });
            } else {
                console.log('insert logic...');
                collection.insertOne(req.body, function(err, result) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.sendStatus(200)
                    }
                });
            }
        })


    } else {
        console.log('no id');
        res.sendStatus(500)
    }
    // collection.insert(req.body, function(err, data) {
    //     console.log(data);
    // })
    res.sendStatus(200);
});

module.exports = router;
