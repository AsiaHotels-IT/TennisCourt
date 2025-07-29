const User = require('../model/user')

exports.read = async(req, res) => {
    try{
        const id = req.params.id
        const thisUser = await User.findOne({ userID : id}).exec()
        res.send(thisUser)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}

exports.list = async (req, res) => {
  try {
    const allUser = await User.find().exec();
    res.send(allUser);
  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
};


exports.create = async (req, res)=>{
    try{
        var data = req.body;
        console.log(data);
        const user = await new User(data).save();
        res.send(user)
    }catch(err){
        console.log(err)
        res.status(500).send('server error')
    }
}

exports.update = async (req, res)=>{
    try{
        const id = req.params.id
        var newData = req.body
        const updated = await User.findOneAndUpdate({ userID : id}, newData, {new: true}).exec()
        res.send(updated)
    }catch(err){
        console.log(err)
        res.status(500).send('Cannot Update')
    }
}

exports.remove = async(req,res)=>{
    try{
        const id = req.params.id
        const removed = await User.findOneAndDelete({ userID : id}).exec()
        res.send('Delete success',removed)
    }catch(err){
        console.log(err)
        res.status(500).send('Cannot Delete')
    }
}
