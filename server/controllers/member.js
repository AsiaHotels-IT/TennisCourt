const Member = require('../model/member')

exports.read = async(req, res) => {
    try{
        const id = req.params.id
        const thisMember = await Member.findOne({ memberID : id}).exec()
        res.send(thisMember)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}

exports.list = async (req, res) => {
  try {
    const allMember = await Member.find()
      .populate('reservationBefore') // << สำคัญมาก!
      .exec();
    res.send(allMember);
  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
};


exports.create = async (req, res)=>{
    try{
        var data = req.body;
        const existing = await Member.findOne({ cusTel: data.cusTel });
        if (existing) {
            return res.status(400).send('เบอร์นี้มีอยู่ในระบบแล้ว');
        }
        console.log(data);
        const member = await new Member(data).save();
        res.send(member)
    }catch(err){
        console.log(err)
        res.status(500).send('server error')
    }
}

exports.update = async (req, res)=>{
    try{
        const id = req.params.id
        var newData = req.body
        const updated = await Member.findOneAndUpdate({ memberID : id}, newData, {new: true}).exec()
        res.send(updated)
    }catch(err){
        console.log(err)
        res.status(500).send('Cannot Update')
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
