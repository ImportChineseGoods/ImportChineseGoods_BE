require('dotenv').config();
const express = require('express'); //commonjs
const configViewEngine = require('./config/viewEngine');
const apiRoutes = require('./routes/api');
const cors = require('cors');
const router = require('./routes/web');

const app = express();
const port = process.env.PORT || 8888;

//config cors
app.use(cors({
    credentials: true,
    preflightContinue: true,
}))
app.options('*', cors());

//config req.body
app.use(express.json()) // for json
app.use(express.urlencoded({ extended: true })) // for form data

//config template engine
configViewEngine(app);


//khai báo route
app.use('/', router);
app.use('/v1/api/', apiRoutes);


(async () => {
    try {
        // await connection();

        app.listen(port, () => {
            console.log(`Backend Nodejs App listening on port ${port}`)
        })
    } catch (error) {
        console.log(">>> Error connect to DB: ", error)
    }
})()
