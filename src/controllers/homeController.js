const connection = require('../config/database');

const getHomepage = async (req, res) => {
    let parameters = [];

    connection.query(
        'select * from parameters;',
        function (err, results, fields) {
            parameters = results;
            console.log("results = ", results); // results contains rows returned by server
        }
    );

    console.log("parameters = ", parameters);
    res.send("hhhhh")
}

module.exports = {
    getHomepage,

}