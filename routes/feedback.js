const router = require('express').Router()
const db = require('../db')
const logger = require('../logger')

router.post('/', (req, res) => {
    logger.info('feeback: ', req.body)

    let { action, content } = req.body

    content = content && content.trim()
    if(action) {
        db.get((err, conn) => {
            conn.collection('feedback').insert({ action, content }, (err, data) => {
                if(err) {
                    logger.error('post feedback error', err)
                }
                return res.sendStatus(200)
            })
        })
    } else {
        logger.error('invalid feedback format', action, feeback)
        return res.sendStatus(400)
    }
});

module.exports = router;
