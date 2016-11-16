const db = require('../db')
const router = require('express').Router()

// get one session
router.get('/:sessionId', (req, res) => {
    db.get((err, conn) => {
        let { sessionId } = req.params;
        conn.collection('session').findOne({ _id: Number(sessionId) }, (err, data) => {
            if (data) {
                res.json(data)
            } else {
                res.sendStatus(404)
            }
        })
    })
})

// query sessions
router.get('/', (req, res) => {
    db.get((err, conn) => {
        conn.collection('session')
            .find(toInt(req.query), { sort: { time: -1 }, limit: 10 })
            .toArray((err, data) => {
                if (data) {
                    res.json(data)
                } else {
                    res.sendStatus(404)
                }
            })
    })
})

function toInt(obj) {
    for (key in obj) {
        let n = Number(obj[key])
        if (isNaN(n)) continue;
        obj[key] = n;
    }
    return obj;
}
module.exports = router;
