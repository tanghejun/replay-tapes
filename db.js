var MongoClient = require('mongodb').MongoClient

var connection;
var url = 'mongodb://localhost:27017/itrack'

exports.get = function(done) {
    if (connection) return done(null, connection)

    MongoClient.connect(url, function(err, db) {
        if (err) return done(err)
        connection = db;
        done(null, db)
    })
}


exports.close = function(done) {
    if (connection) {
        connection.close(function(err, result) {
            connection = null
            done(err, result)
        })
    }
}
