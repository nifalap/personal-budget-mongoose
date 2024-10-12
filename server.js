// Budget API

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;

app.use(cors());
app.use('/', express.static('public'));
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/personalBudget', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('connected to MongoDB via Mongoose')) //show we're connected
.catch(err => console.error('mongoDB connection error:', err));

// define Mongoose Schema and Model
const budgetSchema = new mongoose.Schema({
    title: { type: String, required: true },
    value: { type: Number, required: true },
    color: { 
        type: String, 
        required: true, 
        validate: {
            validator: function(v) {
                return /^#[0-9A-F]{6}$/i.test(v); //enforce 6-digit hex
            },
            message: props => `${props.value} is not a valid hex color code!`
        }
    }
});

const budget = mongoose.model('Budget', budgetSchema);
// mongoDB connection setup
const uri = 'mongodb://localhost:27017/';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let budgetCollection;


app.get('/budget', (req, res) => {
    client.connect()
    .then(() => {
        const db = client.db("personalBudget");
        budgetCollection = db.collection("budget");

    budgetCollection.find({}).toArray().then(data => {
        
        console.log(data);
        res.json({ myBudget: data });
    })

    .catch(err => { console.error("Error finding documents:", err); });

    })
    .catch(err => {
        console.error("Error connecting to MongoDB or finding documents:", err);
    })
    .finally(() => { 
        // client.close();
    });

});

//endpoint to update entries
app.post('/add-budget', (req, res) => {
    client.connect()
    .then(() => {
        const db = client.db("personalBudget");
        budgetCollection = db.collection("budget");

        const newBudgetData = req.body;

        budgetCollection.insertOne(newBudgetData)
            .then(result => {
                console.log('Inserted document ID:', result.insertedId);
                res.status(201).send(`New budget entry added successfully with ID: ${result.insertedId}`);
            })
            .catch(err => {
                console.error("Error inserting document:", err);
                res.status(500).send('Error adding new budget entry');
            });
    })
    .catch(err => {
        console.error("Error connecting to MongoDB:", err);
        res.status(500).send('Error connecting to database');
    });
});


app.get('/hello', (req, res) => {
    res.send('Hello World!');
});


app.listen(port, () => {
    console.log(`API served at http://localhost:${port}`);
});
