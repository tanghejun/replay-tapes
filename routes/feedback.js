const router = require('express').Router()
const db = require('../db')
const logger = require('../logger')

router.post('/', (req, res) => {
    logger.info('feeback: ', req.body)

    let { action, content } = req.body

    content = content && content.trim()
    if (action) {
        db.get((err, conn) => {
            conn.collection('feedback').insert({ action, content, time: +new Date() }, (err, data) => {
                if (err) {
                    logger.error('post feedback error', err)
                }
                return res.sendStatus(200)
            })
        })
    } else {
        logger.error('invalid feedback format', action, feeback)
        return res.sendStatus(400)
    }
})

router.get('/', (req, res) => {
    let { action } = req.query
    db.get((err, conn) => {
        conn.collection('feedback')
            .find(action ? { action: action }: {})
            .toArray((err, data) => {
                if (err) {
                    logger.error('get feeback error', err)
                    return res.send(err)
                }
                return res.json(data)
            })
    })
})

module.exports = router;
