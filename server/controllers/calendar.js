const Calendar = require('../model/calendar');  

exports.list = async (req, res)=>{
    try{
        const allReserv = await Calendar.find({}).exec()
        res.send(allReserv)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}
