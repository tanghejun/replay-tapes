var express = require('express');
var router = express.Router();
var db = require('../db')

/* GET home page. */
router.get('/:id', function(req, res, next) {
    if(req.params.id) {
        console.log(req.params.id);
        var metaCollection = db.get().collection('meta');
        var eventCollection = db.get().collection('events');
        metaCollection.findOne({i: req.params.id}, function(err, result) {
            if(result) {
                eventCollection.findOne({i: req.params.id}, function(err1, result1) {
                    if(result1) {
                        // both meta and events for the id exists, compose them to be a session.
                        var session = {
                            i: result.i,
                            m: result.m,
                            d: result1.d
                        };
                        res.send(session);
                    } else {
                        res.sendStatus(404)
                    }
                })
            } else {
                res.sendStatus(404);
            }
        });
    } else {
        res.sendStatus(404)
        
    }
});


module.exports = router;
