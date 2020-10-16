const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload')
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hia2w.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const app = express()

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('services'));
app.use(fileUpload());

const port = 5000;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const servicesCollection = client.db("creativeAgency").collection("allServices");
  // perform actions on the collection object
  const ordersCollection = client.db("creativeAgency").collection("orders");
  const adminPanel = client.db("creativeAgency").collection("admins");
  const reviewCollection = client.db("creativeAgency").collection("reviews");

 
  //  Add Order in the home page

  app.post('/addOrder', (req, res) => {
    const file = req.files.file
    const encImg = file.data.toString('base64')
    const image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, 'base64')
    }
    const { name, detail, email, work, price, status } = req.body
    ordersCollection.insertOne({ name, detail, email, status, work, price, image })
        .then(result => {
            return res.send(result.insertedCount > 0)
        })
})

app.get('/getOrderList', (req, res) => {
    ordersCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })

//   app.patch('/updateStatus', (req, res) => {
//     console.log(req.body)
//     ordersCollection.updateOne({ _id:ObjectId(req.body.id) },
//         {
//             $set: { status: req.body.status }
//         })
//         .then(result => {
//             console.log(result)
//             res.send(result)
//         })
// })
app.patch('/updateStatus/:id', (req, res) => {
    ordersCollection.updateOne({ _id: ObjectId(req.params.id) },
      {
        $set: { status: req.body.status }
      })
      .then(result => {
        console.log(result)
        res.send(result.modifiedCount > 0)
      })
  });

app.get('/userOrder/:email', (req, res) => {
  const email = req.params.email;
  ordersCollection.find({ email })
      .toArray((err, documents) => {
          res.send(documents)
      })
})

app.post('/addReview', (req, res) => {
  const data = req.body
  console.log(data)
  reviewCollection.insertOne(data)
      .then(result => {
          return res.send(result.insertedCount > 0)
      })
})

app.get('/getReview', (req, res) => {
  reviewCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })



  app.post('/makeAdmin', (req, res)=>{
    
    const email = req.body.email;
    
    adminPanel.insertOne({email})
        .then(result => {
            console.log(result)
        })
    return res.send({ email })
})


app.get('/admins/:email', (req, res) => {
  const email = req.params.email
  adminPanel.find({})
      .toArray((err, documents) => {
          const isAdmin = documents.find(admin => admin.email === email)
          res.send(isAdmin == undefined ? false : true)
      })
})


app.post('/allServices', (req, res)=>{
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    // const filePath = `${__dirname}/services/${file.name}`
    // console.log(title, description,file)
    // file.mv(filePath, err => {
    //     if(err){
    //         console.log(err);
    //         return res.status(500).send({msg: 'failed to upload icon'})
    //     }

        const newImg = file.data;
        const encImg = newImg.toString('base64');
        var image = {
            contentType: req.files.file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        servicesCollection.insertOne({title, description, image})
        .then(result =>{
            // fs.remove(filePath, err => {
            //     if(err){
            //         console.log(error);
            //         res.status(500).send({msg: 'failed to upload icon'})
            //     }
            //     res.send(result.insertedCount > 0)
            // })
            res.send(result.insertedCount>0)
        })
    })
// })


  app.get('/getServices', (req, res) => {
    servicesCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })




});

app.get('/', (req, res) => {
    res.send("hello from db it's working working")
})

app.listen(process.env.PORT || port)