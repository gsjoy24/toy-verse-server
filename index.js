const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.listen(port, () => {
	console.log(`server is running on ${port} for ToyVerse`);
});

app.get('/', (req, res) => {
	res.send(`server is running for ToyVerse`);
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER_PASS}@cluster0.nbdk5o7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true
	}
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		client.connect();

		const toyCollection = client.db('toyVerse').collection('toys');
		const indexKeys = { toy_name: 1 };
		const indexOptions = { name: 'SearchToys' };
		const result = await toyCollection.createIndex(indexKeys, indexOptions);

		// for search method
		app.get('/search_toys/:name', async (req, res) => {
			const searchName = req.params.name;
			const result = await toyCollection
				.find({ toy_name: { $regex: searchName, $options: 'i' } })
				.limit(20)
				.toArray();
			res.send(result);
		});

		// add toys method
		app.post('/toys', async (req, res) => {
			const toy = req.body;
			const result = await toyCollection.insertOne(toy);
			res.send(result);
		});

		// get toys by filtering
		app.get('/toys', async (req, res) => {
			const filter = req.query;
			const result = await toyCollection.find(filter).toArray();
			res.send(result);
		});

		// sorting method
		app.get('/toys/:user/sort', async (req, res) => {
			const type = req.query.type === 'ascending';
			const user = req.params.user;
			const query = { seller_email: user };

			let sortObj = { price: 1 };
			if (type) {
				sortObj = { price: 1 };
			} else {
				sortObj = { price: -1 };
			}
			const result = await toyCollection.find(query).sort(sortObj).toArray();
			res.send(result);
		});

		// to get single toy
		app.get('/toys/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await toyCollection.findOne(query);
			res.send(result);
		});

		// update toys information
		app.patch('/toys/:id', async (req, res) => {
			const id = req.params.id;
			const toy = req.body;
			const query = { _id: new ObjectId(id) };
			const updatedDoc = {
				$set: toy
			};
			const result = await toyCollection.updateOne(query, updatedDoc);
			res.send(result);
		});

		// delete from database
		app.delete('/toys/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await toyCollection.deleteOne(query);
			res.send(result);
		});

		// Send a ping to confirm a successful connection
		await client.db('admin').command({ ping: 1 });
		console.log('Pinged your deployment. You successfully connected to MongoDB!');
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);
