const express = require('express');
const taskRoutes = require('./routers/task');
const userRoutes = require('./routers/user');

const port = process.env.PORT;

const app = express();

//middlewares
app.use(express.json());
app.use(taskRoutes);
app.use(userRoutes);

app.listen(port, () => console.log('server started listening on port' + port))