const router = require('express').Router()
const db = require('../db')
const logger = require('../logger')

router.post('/', function(req, res, next) {
    logger.info('events: ', req.body)
    let { i, d } = req.body
    if (i && d) {
        db.get((err, conn) => {
            conn.collection('session').update(
                { _id: i },
                { $push: { events: { $each: d } } },
                { upsert: true },
                (err, data) => {
                    if (err) {
                        logger.error('post events error: ', err)
                    }
                    return res.sendStatus(200)
                }
            )
        })
    } else {
        logger.error('post events missing i & d', i, d)
        return res.sendStatus(400)
    }
});

module.exports = router;
