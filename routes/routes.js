const express = require('express');

const router = express.Router()

module.exports = router;

const Model = require('../models/model');

/*//Post Method
router.post('/post', (req, res) => {
    res.send('Post API')
})*/
router.post('/signup', function (req, res) {
    const newUser = new User({
        username: req.body.username,
        password: req.body.password
    });
    newUser.save(function (err) {
        if (err) {
            console.log(err);
            res.status(500).send();
        } else {
            console.log('User saved successfully!');
            res.redirect('/success');
        }
    });
});


router.post('/post', async (req, res) => {
    const data = new Model({
        id: req.body.id,
        name: req.body.name,
        room: req.body.room
    })

    try {
        const dataToSave = await data.save();
        res.status(200).json(dataToSave)
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

/*//Get all Method
router.get('/getAll', (req, res) => {
    res.send('Get All API')
})*/

router.get('/getAll', async (req, res) => {
    try{
        const data = await Model.find();
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

/*//Get by ID Method
router.get('/getOne/:id', (req, res) => {
    res.send(req.params.id)
})*/

router.get('/getOne/:id', async (req, res) => {
    try{
        const data = await Model.findById(req.params.id);
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

/*//Update by ID Method
router.patch('/update/:id', (req, res) => {
    res.send('Update by ID API')
})*/

//Update by ID Method
router.patch('/update/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updatedData = req.body;
        const options = { new: true };

        const result = await Model.findByIdAndUpdate(
            id, updatedData, options
        )

        res.send(result)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

/*//Delete by ID Method
router.delete('/delete/:id', (req, res) => {
    res.send('Delete by ID API')
})*/

//Delete by ID Method
router.delete('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Model.findByIdAndDelete(id)
        res.send(`Document with ${data.name} has been deleted..`)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

