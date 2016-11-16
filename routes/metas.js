const router = require('express').Router()
const db = require('../db')

router.post('/', function(req, res, next) {
    console.log(req.body)
    let { i, m } = req.body
    if (i && m) {
        db.get((err, conn) => {
            conn.collection('session').update(
                { _id: i},
                { $set: { meta: m, time: +new Date() } },
                { upsert: true },
                (err, data) => {
                    if(err) return res.send(err)
                    return res.send(200)
                }
            )
        })
    } else {
        res.sendStatus(400)
    }
});

module.exports = router;
