const CancelReserv = require('../model/cancelReservation');

exports.read = async(req, res) => {
    try{
        const id = req.params.id
        const thisMember = await CancelReserv.findOne({ _id : id}).exec()
        res.send(thisMember)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}

exports.list = async (req, res) => {
  try {
    const allMember = await CancelReserv.find()
      .exec();
    res.send(allMember);
  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
};
