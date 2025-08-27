import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/th';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { getReservations, getReservationById } from '../function/reservation';
import { Modal, Box, Button, Typography } from '@mui/material';

const localizer = momentLocalizer(moment);
moment.updateLocale('th', { week: { dow: 0 } }); // Start week on Sunday
const DragAndDropCalendar = withDragAndDrop(Calendar);

const mapReservationsToEvents = (reservations) => {
  return reservations.map(resv => {
    const [day, month, year] = resv.reservDate.split('/');
    const startDateTime = new Date(year, month - 1, day, ...resv.startTime.split(':'));
    const endDateTime = new Date(year, month - 1, day, ...resv.endTime.split(':'));

    return {
      id: resv.reservID,
      title: `${moment(startDateTime).format('HH:mm')} - ${moment(endDateTime).format('HH:mm')}`,
      start: startDateTime,
      end: endDateTime,
      paymentMethod: resv.paymentMethod
    };
  });
};

const formats = {
  timeGutterFormat: 'HH:mm',
  eventTimeRangeFormat: ({ start, end }, culture, local) =>
    `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
  dayHeaderFormat: (date, culture, localizer) =>
      moment(date).format('ddddที่ D MMMM YYYY'),
  dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
    ` ${moment(start).format('D MMMM YYYY')} - ${moment(end).format('D MMMM YYYY')}`,
};

const CalendarForCus = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await getReservations();
        const mappedEvents = mapReservationsToEvents(res.data);
        setEvents(mappedEvents);
      } catch (error) {
        console.error('Error loading reservations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, []);

  // Handler for clicking a date (slot)
  const handleSelectSlot = (slotInfo) => {
    const dayEvents = events.filter(event => moment(event.start).isSame(slotInfo.start, 'day'));
    setSelectedEvent(dayEvents);
    setIsModalOpen(true);
  };

  // Detect mobile device (screen width <= 480)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 480;

  if (loading) {
    return <div>กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className='booking-container' style={{ padding: '10px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '18px' }}>
              <h1 style={{ textAlign: 'left', fontSize: '2rem', color: '#65000a' }}>ตารางจองสนามเทนนิส</h1>            
            {/* ตารางราคาหัวตาราง */}
            <Box sx={{
              mb: 1.5,
              borderRadius: 2,
              background: '#fffbe7',
              border: '1px solid #e0c080',
              padding: { xs: '12px 10px', sm: '14px 20px' },
              maxWidth: 560,
              margin: '0 0 0 auto',
              fontSize: { xs: '0.95em', sm: '1.05em' }
            }}>
              <Typography sx={{ color: '#65000a', fontWeight: 700, mb: 0.4 }}>
                อัตราค่าบริการจองคอร์ท
              </Typography>
              <Typography>
                <span style={{ color:'#344', fontWeight:500 }}>07.00-18.00</span> ชั่วโมงละ <b style={{ color:'#267a25' }}>450 บาท</b>
              </Typography>
              <Typography>
                <span style={{ color:'#344', fontWeight:500 }}>18.00-22.00</span> ชั่วโมงละ <b style={{ color:'#c62828' }}>600 บาท</b>
              </Typography>
            </Box>
        </div>
        
        <DragAndDropCalendar
          className='calendar'
          localizer={localizer}
          formats={formats}
          min={new Date(1970, 1, 1, 7, 0)}
          max={new Date(1970, 1, 1, 22, 0)}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={['month']}
          selectable
          onSelectSlot={handleSelectSlot}
          style={{
            height: '85vh',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            backgroundColor: '#fff',
            width: '100%',
            fontSize: '15px',
            whiteSpace: 'pre-line'
          }}
          draggableAccessor={null}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: '#d7ba80',
              color: '#65000a',
              borderRadius: '8px',
              padding: '2px 6px'
            }
          })}
        />

        {/* Modal to show bookings for the selected day */}
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          aria-labelledby="day-bookings-modal-title"
          aria-describedby="day-bookings-modal-desc"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 3,
            minWidth: { xs: '90vw', sm: 340 },
            maxWidth: 400,
          }}>
            <Typography id="day-bookings-modal-title" variant="h6" component="h2" sx={{ mb: 1, color: '#65000a', textAlign: 'center' }}>
              เวลาการจองทั้งหมด
            </Typography>
            {selectedEvent && selectedEvent.length > 0 ? (
              <div style={{ fontSize: '1.1em', color: '#333' }}>
                {selectedEvent
                  .sort((a, b) => new Date(a.start) - new Date(b.start))
                  .map((event, index) => (
                    <div key={index} style={{ fontSize: '0.95em', marginBottom: '8px' }}>
                      <div>เวลา: <b>{moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}</b></div>
                      <div>
                        ราคา: <b style={{
                          color: moment(event.start).hour() < 18 ? '#267a25' : '#c62828'
                        }}>
                          {moment(event.start).hour() < 18 ? '450 บาท/ชั่วโมง' : '600 บาท/ชั่วโมง'}
                        </b>
                      </div>
                      <hr style={{ margin: '8px 0' }} />
                    </div>
                ))}
              </div>
            ) : <div>ไม่มีการจองในวันนี้</div>}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button onClick={() => setIsModalOpen(false)} sx={{ color: '#65000a' }}>ปิด</Button>
            </Box>
          </Box>
        </Modal>

        {/* Add a red message for mobile screens */}
        {isMobile && (
          <div style={{
            color: 'red',
            textAlign: 'center',
            marginTop: '10px',
            fontWeight: 500,
            fontSize: '1.05em'
          }}>
            กดค้างที่วันที่เพื่อแสดงเวลาจองเพิ่มเติม
          </div>
        )}
      </div>
      <style>
        {`
          @media (max-width: 768px) {
              .rbc-calendar, .rbc-month-view, .rbc-header, .rbc-date-cell, .rbc-event, .rbc-toolbar-label, .rbc-show-more {
                font-size: 11px !important;
                padding: 2px !important;
              }
              .rbc-toolbar-label {
                font-size: 1.1rem !important;
              }
            }
                    
            @media (max-width: 480px) {
              .rbc-calendar, .rbc-month-view, .rbc-header, .rbc-date-cell, .rbc-event, .rbc-toolbar-label, .rbc-show-more {
                font-size: 8px !important;
                padding: 1px !important;
              }
              .rbc-toolbar-label {
                font-size: 0.9rem !important;
              }
              h1 {
                font-size: 1rem !important;
              }
              .MuiTypography-root {
                font-size: 0.75rem !important;
              }
            }
        `}
      </style>
    </div>
  );
};

export default CalendarForCus;