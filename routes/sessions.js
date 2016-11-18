const db = require('../db')
const router = require('express').Router()
const moment = require('moment')

// get one session
router.get('/:sessionId', (req, res) => {
    db.get((err, conn) => {
        let { sessionId } = req.params;
        conn.collection('session').findOne({ _id: sessionId }, (err, data) => {
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
    console.log(req.query);
    let {time, userId, tags} = toInt(req.query)
    let start, end, querySql = {}
    console.log(time);
    if(time && typeof time === 'number') {
        start = +moment(time).startOf('day')
        end = +moment(time).endOf('day')
        querySql.time = {$gt: start, $lt: end}
    }
    if(tags) {
        tags = tags.split(',')
        querySql['meta.tags'] = {$in: tags}
    }
    if(userId) {
        querySql['$or'] = [{'meta.userId': userId}, {'meta.trackId': userId}]
    }
    // return res.json(querySql)

    db.get((err, conn) => {
        conn.collection('session')
            .find(querySql, { sort: { time: -1 }, limit: 10 })
            .toArray((err, data) => {
                if (data) {
                	// leave broken data behind
                    res.json(data.filter(each => each.events && each.events.length && each.meta))
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
