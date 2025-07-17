const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

connectToDB = () => {
    mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        console.log('connected To DB');
    });
};

module.exports = connectToDB;