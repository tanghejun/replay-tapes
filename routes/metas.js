const router = require('express').Router()
const db = require('../db')
const logger = require('../logger')

router.post('/', function(req, res, next) {
    logger.info('meta cookies: ', req.cookies)
    logger.info('meta: ', req.body)

    let { __u, __trackId } = req.cookies
    let { i, m } = req.body
    if (i && m) {

        m.userId = __u
        m.trackId = __trackId

        db.get((err, conn) => {
            conn.collection('session').update(
                { _id: i},
                { $set: { meta: m, time: +new Date() } },
                { upsert: true },
                (err, data) => {
                    if(err)  {
                        logger.error('post meta error', err)
                    }
                    return res.sendStatus(200)
                }
            )
        })
    } else {
        logger.error('post meta invalid i & m', i, m)
        res.sendStatus(400)
    }
});

module.exports = router;
