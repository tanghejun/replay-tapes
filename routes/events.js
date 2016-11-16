const router = require('express').Router()
const db = require('../db')

router.post('/', function(req, res, next) {
    console.log(req.body)
    let { i, d } = req.body
    if (i && d) {
        db.get((err, conn) => {
            conn.collection('session').update(
                { _id: i },
                { $push: { events: { $each: d } } },
                { upsert: true },
                (err, data) => {
                    if (err) return res.send(err)
                    return res.send(data)
                }
            )
        })
    } else {
        res.sendStatus(400)
    }
});

module.exports = router;
