const ReservationStadium = require('../model/ReservationStadium')
const Member = require('../model/member')
const CancelReservation = require('../model/cancelReservation')
const Calendar = require('../model/calendar');

exports.read = async(req, res)=>{
    try{
        const id = req.params.id
        const thisReserv = await ReservationStadium.findOne({reservID : id}).exec()
        res.send(thisReserv)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}

exports.list = async (req, res)=>{
    try{
        const allReserv = await ReservationStadium.find({}).exec()
        res.send(allReserv)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}

exports.create = async (req, res) => {
  try {
    const data = req.body;

    // ตรวจสอบสมาชิก
    if (data.memberID) {
      const member = await Member.findOne({ memberID: data.memberID });
      if (!member) {
        return res.status(400).json({ message: 'ไม่พบรหัสสมาชิกนี้ในระบบ' });
      }
    }
    // หา reservation ที่วันที่เดียวกัน
    const existingReservations = await ReservationStadium.find({ reservDate: data.reservDate, status: { $ne: 'ยกเลิก' } });

    // ตรวจสอบเวลาซ้อนกัน
    for (const reserv of existingReservations) {
      if (isTimeOverlap(data.startTime, data.endTime, reserv.startTime, reserv.endTime)) {
        return res.status(400).json({ message: 'เวลาจองซ้อนกับการจองอื่นแล้ว' });
      }
    }

    // สร้างการจองใหม่
    const reserv = await new ReservationStadium(data).save();

    if (data.memberID) {
      const member = await Member.findOne({ memberID: data.memberID });
      if (member) {
        member.reservationBefore.push(reserv._id);
        await member.save();
      }
    }

    // เพิ่มข้อมูลไปยัง Calendar
    const calendarEntry = new Calendar({
      reservDate: data.reservDate,
      startTime: data.startTime,
      endTime: data.endTime
    });
    await calendarEntry.save();

    res.send(reserv);

  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const newData = req.body;

    if (newData.memberID) {
      const member = await Member.findOne({ memberID: newData.memberID });
      if (!member) {
        return res.status(400).json({ message: 'ไม่พบรหัสสมาชิกนี้ในระบบ' });
      }
    }

    const existingReservations = await ReservationStadium.find({ 
      reservDate: newData.reservDate, 
      reservID: { $ne: id }, 
      status: { $ne: 'ยกเลิก' } 
    });

    for (const reserv of existingReservations) {
      if (isTimeOverlap(newData.startTime, newData.endTime, reserv.startTime, reserv.endTime)) {
        return res.status(400).json({ message: 'เวลาจองซ้อนกับการจองอื่นแล้ว' });
      }
    }

    const hours = calculateHours(newData.startTime, newData.endTime);
    newData.amount = hours * 200;

    const updated = await ReservationStadium.findOneAndUpdate({ reservID: id }, newData, { new: true }).exec();

    if (!updated) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลการจองที่ต้องการแก้ไข' });
    }

     if (newData.memberID) {
      const member = await Member.findOne({ memberID: newData.memberID });
      if (member) {
        if (!Array.isArray(member.reservationBefore)) {
          member.reservationBefore = [];
        }
        member.reservationBefore.push(updated._id);
        await member.save();
      }
    }

    res.send(updated);

  } catch (err) {
    console.log(err);
    res.status(500).send('Cannot Update');
  }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;

    // 1. หาเรคคอร์ดที่ต้องการเปลี่ยนสถานะ
    const reservation = await ReservationStadium.findOne({ reservID: id }).exec();

    if (!reservation) {
      return res.status(404).send('Reservation not found');
    }

    // 2. ตรวจสอบว่ามีข้อมูลใน CancelReservation อยู่แล้วหรือไม่
    const existingCancel = await CancelReservation.findOne({ reservID: reservation.reservID });
    if (!existingCancel) {
      const cancelData = new CancelReservation({
        reservID: reservation.reservID,
        memberID: reservation.memberID,
        cusName: reservation.cusName,
        cusTel: reservation.cusTel,
        reservDate: reservation.reservDate,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: 'ยกเลิก',
        paymentMethod: reservation.paymentMethod,
        refPerson: reservation.refPerson,
        amount: reservation.amount,
        username: reservation.username, 
      });

      await cancelData.save();
    }

    // 3. เปลี่ยนสถานะของ ReservationStadium เป็น "ยกเลิก"
    reservation.status = 'ยกเลิก';
    await reservation.save();

    res.send({ message: 'Reservation status updated to canceled and moved to cancel table' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Cannot cancel reservation');
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { reservDate, startTime, endTime } = req.body;

    if (!reservDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'กรุณาระบุ reservDate, startTime และ endTime' });
    }

    // ดึงข้อมูลจองสนามที่ตรงกับวัน reservDate
    const existingReservations = await ReservationStadium.find({ reservDate });

    // ตรวจสอบเวลาซ้อนทับ
    const isOverlap = existingReservations.some(reservation => 
      isTimeOverlap(startTime, endTime, reservation.startTime, reservation.endTime)
    );

    if (isOverlap) {
      return res.json({ available: false, message: 'สนามไม่ว่างในช่วงเวลาที่เลือก' });
    } else {
      return res.json({ available: true, message: 'สนามว่าง' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบ' });
  }
};


function isTimeOverlap(start1, end1, start2, end2) {
  return (start1 < end2) && (start2 < end1);
}

function isFullHourDuration(startTime, endTime) {
  if (!startTime || !endTime || typeof startTime !== 'string' || typeof endTime !== 'string') {
    console.error("isFullHourDuration: invalid time input", { startTime, endTime });
    return false;
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  const duration = endTotalMinutes - startTotalMinutes;

  return duration > 0 && duration % 60 === 0;
}

function calculateHours(startTime, endTime) {
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  const hours = (end - start) / (1000 * 60 * 60); // คำนวณชั่วโมง
  return hours;
}

exports.payAndCreateReceipt = async (req, res) => {
  try {
    const id = req.params.id;
    const { paymentMethod, received, changeVal, username, price } = req.body;

    // ตรวจสอบว่าการจองนี้มีเลขใบเสร็จหรือยัง
    const reserv = await ReservationStadium.findOne({ reservID: id });
    if (!reserv) return res.status(404).json({ message: 'ไม่พบข้อมูลการจอง' });
    if (reserv.receiptNumber) {
      return res.status(400).json({ message: 'ชำระเงินและออกใบเสร็จแล้ว' });
    }

    // สร้างเลขใบเสร็จใหม่ (TN + ปีพ.ศ. 2 หลัก + ลำดับ 4 หลัก)
    const now = new Date();
    const buddhistYear = now.getFullYear() + 543;
    const yearShort = String(buddhistYear).slice(-2);

    // หาลำดับสูงสุดของปีนี้
    const lastReceipt = await ReservationStadium.findOne({
      receiptNumber: new RegExp(`^TN${yearShort}\\d{4}$`)
    }).sort({ receiptNumber: -1 });

    let seq = 1;
    if (lastReceipt && lastReceipt.receiptNumber) {
      seq = parseInt(String(lastReceipt.receiptNumber).slice(4), 10) + 1; // ตัด TN68 เหลือ 0001
    }
    const seqStr = seq.toString().padStart(4, '0');
    const receiptNumber = `TN${yearShort}${seqStr}`;
    const receiptDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    // บันทึกข้อมูลการชำระเงินและเลขใบเสร็จ
    reserv.paymentMethod = paymentMethod;
    reserv.received = received;
    reserv.changeVal = changeVal;
    reserv.username = username;
    reserv.price = price;
    reserv.payDate = now.toLocaleString("th-TH", { hour12: false });
    reserv.receiptDate = receiptDate;
    reserv.receiptNumber = receiptNumber;

    await reserv.save();

    res.json({ message: 'ชำระเงินสำเร็จ', reserv });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการชำระเงิน' });
  }
};
