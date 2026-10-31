require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// The access token is read from the .env file, so it never ends up in GitHub.
const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS;

// Your custom object's ID, from its list view URL in HubSpot (it looks like 2-1234567).
const OBJECT_TYPE = '2-72069393';

// Your three custom properties.
// "name" is the property's INTERNAL name (what the API uses).
// "label" is the column heading / form label shown on your pages.
const PROPERTIES = [
    { name: 'name', label: 'Name' },
    { name: 'genre', label: 'Genre' },
    { name: 'title', label: 'Title' },
    { name: 'publication_date', label: 'Publication Date' }
];

// Every API call sends these headers. The Authorization header carries your token.
const headers = {
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    'Content-Type': 'application/json'
};

// ROUTE 1: Homepage. GETs all the custom object records and shows them in a table.
app.get('/', async (req, res) => {
    const propertyNames = PROPERTIES.map(property => property.name).join(',');
    const getRecords = `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE}?limit=100&properties=${propertyNames}`;

    try {
        const response = await axios.get(getRecords, { headers });
        const records = response.data.results;
        res.render('homepage', {
            title: 'Custom Objects | Integrating With HubSpot I Practicum',
            properties: PROPERTIES,
            records
        });
    } catch (error) {
        console.error(error.response ? error.response.data : error);
        res.status(500).send('Could not load records. Check the terminal for the error.');
    }
});

// ROUTE 2: Shows the HTML form for creating a new record.
app.get('/update-cobj', (req, res) => {
    res.render('updates', {
        title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
        properties: PROPERTIES
    });
});

// ROUTE 3: Receives the form data, POSTs it to HubSpot to create a record, then goes back to the homepage.
app.post('/update-cobj', async (req, res) => {
    const newRecord = { properties: {} };
    PROPERTIES.forEach(property => {
        newRecord.properties[property.name] = req.body[property.name];
    });

    const createRecord = `https://api.hubapi.com/crm/v3/objects/${OBJECT_TYPE}`;

    try {
        await axios.post(createRecord, newRecord, { headers });
        res.redirect('/');
    } catch (error) {
        console.error(error.response ? error.response.data : error);
        res.status(500).send('Could not create the record. Check the terminal for the error.');
    }
});

app.listen(3000, () => console.log('Listening on http://localhost:3000'));