const ReprintReceipt = require('../model/reprintReceipt')

exports.read = async(req, res) => {
    try{
        const id = req.params.id
        const thisReprint = await ReprintReceipt.findOne({ reservID : id}).exec()
        res.send(thisReprint)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}

exports.list = async (req, res) => {
  try {
    const allMember = await ReprintReceipt.find().exec();
    res.send(allMember);
  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
};


exports.create = async (req, res)=>{
    try{
        var data = req.body;
        const member = await new ReprintReceipt(data).save();
        res.send(member)
    }catch(err){
        console.log(err)
        res.status(500).send('server error')
    }
}


exports.remove = async(req,res)=>{
    try{
        const id = req.params.id
        const removed = await Member.findOneAndDelete({ memberID : id}).exec()
        res.send('Delete success',removed)
    }catch(err){
        console.log(err)
        res.status(500).send('Cannot Delete')
    }
}
