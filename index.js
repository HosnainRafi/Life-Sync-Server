const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://life-sync-fab40.web.app', // Remove trailing slash
  ],
  credentials: true, // ✅ Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'], // ✅ Allow necessary headers
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Life Sync is running successfully!');
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6wmwp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const UsersCollection = client.db('LifeSyncDB').collection('users');
    const BlogPostCollection = client.db('LifeSyncDB').collection('blogPost');
    const DonationRequestCollection = client
      .db('LifeSyncDB')
      .collection('donationRequests');

    app.get('/users', async (req, res) => {
      const result = await UsersCollection.find().toArray();
      res.send(result);
    });
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await UsersCollection.find(query).toArray();
      res.send(result);
    });

    app.patch('/users/:email', async (req, res) => {
      const email = req.params.email;
      const updatedUserData = req.body;

      try {
        const result = await UsersCollection.updateOne(
          { email: email },
          { $set: updatedUserData }
        );

        if (result.modifiedCount === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.patch('/users/block/:id', async (req, res) => {
      const id = req.params.id;
      const result = await UsersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'block' } }
      );
      res.send(result);
    });
    app.patch('/users/active/:id', async (req, res) => {
      const id = req.params.id;
      const result = await UsersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'active' } }
      );
      res.send(result);
    });
    app.patch('/users/volunteer/:id', async (req, res) => {
      const id = req.params.id;
      const result = await UsersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role: 'volunteer' } }
      );
      res.send(result);
    });
    app.patch('/users/makeAdmin/:id', async (req, res) => {
      const id = req.params.id;
      const result = await UsersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role: 'admin' } }
      );
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await UsersCollection.insertOne(user);
      res.send(result);
    });

    app.get('/donation-requests', async (req, res) => {
      const result = await DonationRequestCollection.find().toArray();
      res.send(result);
    });
    app.get('/donation-requests/donor/:email', async (req, res) => {
      try {
          const { email } = req.params;
          const donationRequests = await DonationRequestCollection.find({ donorsEmail: email }).toArray();
          res.send(donationRequests);
      } catch (error) {
          console.error("Error fetching donation requests:", error);
          res.status(500).send({ message: "Internal Server Error" });
      }
  });

  app.get('/donation-requests/:email', async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const result = await DonationRequestCollection.find(query).toArray();
    res.send(result);
  });

    app.get('/donors', async (req, res) => {
      try {
        const { bloodGroup, district, upazila, role} = req.query;
        const query = {};
    
        if (bloodGroup) query.bloodGroup = bloodGroup;
        if (district) query.district = district;
        if (upazila) query.upazila = upazila; 
        if (role) query.role = 'Donor'; 
        console.log(query);
        const donors = await UsersCollection.find(query).toArray();
        res.json(donors);
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    });
    
    

    app.post('/donation-requests', async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await DonationRequestCollection.insertOne(user);
      res.send(result);
    });
    app.get('/donation-requests/home/:status', async (req, res) => {
      const value = req.params.status;
      const query = { status: value };
      const result = await DonationRequestCollection.find(query).toArray();
      res.send(result);
    });
    app.get('/donation-requests/single/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await DonationRequestCollection.find(query).toArray();
      res.send(result);
    });

    app.patch('/donation-requests/single-update/:id', async (req, res) => {
      try {
          const id = req.params.id;
          const { donorsEmail } = req.body; // Extract donorsEmail from request body
  
          const result = await DonationRequestCollection.updateOne(
              { _id: new ObjectId(id) },
              { $set: { status: 'inprogress', donorsEmail } } // Update both status and donorsEmail
          );
  
          res.send(result);
      } catch (error) {
          console.error("Error updating donation request:", error);
          res.status(500).send({ message: "Internal Server Error" });
      }
  });
  
    app.patch('/donation-requests/done/:id', async (req, res) => {
      const id = req.params.id;
      const result = await DonationRequestCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'done' } }
      );
      res.send(result);
    });
    app.patch('/donation-requests/cancel/:id', async (req, res) => {
      const id = req.params.id;
      const result = await DonationRequestCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'canceled' } }
      );
      res.send(result);
    });
    app.patch('/donation-requests/edit/:id', async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      const result = await DonationRequestCollection.updateMany(
        { _id: new ObjectId(id) },
        {
          $set: {
            recipientName: user.recipientName,
            bloodGroup: user.bloodGroup,
            phoneNumber: user.phoneNumber,
            recipientDistrict: user.recipientDistrict,
            recipientUpazila: user.recipientUpazila,
            hospitalName: user.hospitalName,
            address: user.address,
            donationDate: user.donationDate,
            donationTime: user.donationTime,
            description: user.description,
            status: 'pending',
            email: user.email,
          },
        }
      );
      res.send(result);
    });

    app.delete('/donation-requests/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await DonationRequestCollection.deleteOne(query);
      res.send(result);
    });
    app.get('/donation-requests/view-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await DonationRequestCollection.find(query).toArray();
      res.send(result);
    });

    //blog post route starts here
    app.post('/blog-post', async (req, res) => {
      const blogPost = req.body;
      const result = await BlogPostCollection.insertOne(blogPost);
      res.send(result);
    });

    app.get('/blog-post', async (req, res) => {
      const result = await BlogPostCollection.find().toArray();
      res.send(result);
    });
    app.get('/blog-post/status', async (req, res) => {
      const query = { status: 'Publish' };
      const result = await BlogPostCollection.find(query).toArray();
      res.send(result);
    });
    app.get('/blog-post/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await BlogPostCollection.find(query).toArray();
      res.send(result);
    });

    app.patch('/blog-post/publish/:id', async (req, res) => {
      const id = req.params.id;
      const result = await BlogPostCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'Publish' } }
      );
      res.send(result);
    });
    app.patch('/blog-post/unpublished/:id', async (req, res) => {
      const id = req.params.id;
      const result = await BlogPostCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'Draft' } }
      );
      res.send(result);
    });
    app.get('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: true, // ✅ Required for HTTPS
          sameSite: 'none', // ✅ Important for cross-site requests
        })
        .status(200)
        .json({ success: true, message: 'Logged out successfully' });
    });
    

    //donation request new
    app.get('/donation-requests-new', async (req, res) => {
      try {
        const { status, bloodGroup, district, upazila } = req.query;
    
        const query = {};
    
        if (status) query.status = status;
        if (bloodGroup) query.bloodGroup = bloodGroup;
        if (district) query.recipientDistrict = district;
        if (upazila) query.recipientUpazila = upazila;
    
        console.log("Query:", query);
    
        const requests = await DonationRequestCollection.find(query).toArray();
        res.send(requests);
      } catch (error) {
        console.error("Error fetching donation requests:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    
    
    

    app.delete('/blog-post/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await BlogPostCollection.deleteOne(query);
      res.send(result);
    });

    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Life Sync server listening on port ${port}`);
});
